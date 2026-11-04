"use strict"
const { initAuthCreds } = require("./auth-utils")
const { BufferJSON } = require("./generics")
const { proto } = require("../../WAProto")

/**
 * @param {import('mongodb').Collection} collection
 * @param {string} [sessionId='default']
 */
async function useMongoAuthState(collection, sessionId = "default") {
    if (!collection || typeof collection.findOne !== "function") {
        throw new Error("useMongoAuthState requires a MongoDB collection")
    }
    const key = (type, id) => ({ session: sessionId, type, id })
    const readCreds = async () => {
        const doc = await collection.findOne({ session: sessionId, type: "creds", id: "creds" })
        return doc?.data ? JSON.parse(JSON.stringify(doc.data), BufferJSON.reviver) : initAuthCreds()
    }
    const creds = await readCreds()

    return {
        state: {
            creds,
            keys: {
                get: async (type, ids) => {
                    const out = {}
                    const cursor = await collection.find({ session: sessionId, type, id: { $in: ids } }).toArray()
                    for (const doc of cursor) {
                        let v = doc.data
                        if (typeof v === "string") v = JSON.parse(v, BufferJSON.reviver)
                        else v = JSON.parse(JSON.stringify(v), BufferJSON.reviver)
                        if (type === "app-state-sync-key" && v) v = proto.Message.AppStateSyncKeyData.fromObject(v)
                        out[doc.id] = v
                    }
                    return out
                },
                set: async (data) => {
                    for (const type in data) {
                        for (const id in data[type]) {
                            const value = data[type][id]
                            if (value) {
                                await collection.updateOne(
                                    key(type, id),
                                    { $set: { data: JSON.parse(JSON.stringify(value, BufferJSON.replacer)) } },
                                    { upsert: true }
                                )
                            } else {
                                await collection.deleteOne(key(type, id))
                            }
                        }
                    }
                }
            }
        },
        saveCreds: async () => {
            await collection.updateOne(
                key("creds", "creds"),
                { $set: { data: JSON.parse(JSON.stringify(creds, BufferJSON.replacer)) } },
                { upsert: true }
            )
        }
    }
}

module.exports = { useMongoAuthState }
