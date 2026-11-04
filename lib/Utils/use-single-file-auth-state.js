"use strict"
const fs = require("fs")
const path = require("path")
const { initAuthCreds } = require("./auth-utils")
const { BufferJSON } = require("./generics")
const { proto } = require("../../WAProto")

async function useSingleFileAuthState(filePath) {
    const dir = path.dirname(filePath)
    fs.mkdirSync(dir === "." ? process.cwd() : dir, { recursive: true })
    const read = () => {
        try {
            return JSON.parse(fs.readFileSync(filePath, "utf8"), BufferJSON.reviver)
        } catch { return null }
    }
    const write = (data) => {
        const payload = JSON.stringify(data, BufferJSON.replacer, 0)
        const tmp = filePath + ".tmp"
        fs.writeFileSync(tmp, payload, { mode: 0o600 })
        fs.renameSync(tmp, filePath)
        try { fs.chmodSync(filePath, 0o600) } catch (_) {}
    }
    const full = read() || { creds: initAuthCreds(), keys: {} }
    if (!full.creds) full.creds = initAuthCreds()
    if (!full.keys) full.keys = {}

    return {
        state: {
            creds: full.creds,
            keys: {
                get: async (type, ids) => {
                    const out = {}
                    for (const id of ids) {
                        let v = full.keys?.[type]?.[id]
                        if (type === "app-state-sync-key" && v) v = proto.Message.AppStateSyncKeyData.fromObject(v)
                        out[id] = v
                    }
                    return out
                },
                set: async (data) => {
                    for (const category in data) {
                        full.keys[category] = full.keys[category] || {}
                        for (const id in data[category]) {
                            const value = data[category][id]
                            if (value) full.keys[category][id] = value
                            else delete full.keys[category][id]
                        }
                    }
                    write(full)
                }
            }
        },
        saveCreds: async () => write(full)
    }
}

module.exports = { useSingleFileAuthState }
