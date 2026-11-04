"use strict"
const fs = require("fs")
const path = require("path")
const { initAuthCreds } = require("./auth-utils")
const { BufferJSON } = require("./generics")
const { proto } = require("../../WAProto")

/**
 * SQLite auth state (optional better-sqlite3).
 * Falls back to file-based folder if better-sqlite3 missing.
 */
async function useSQLiteAuthState(dbPath) {
    let Database
    try {
        Database = require("better-sqlite3")
    } catch {
        // soft fallback: multi-file next to db path
        const { useMultiFileAuthState } = require("./use-multi-file-auth-state")
        const folder = dbPath.replace(/\.db$/i, "") || path.join(path.dirname(dbPath), "auth_sqlite_fallback")
        return useMultiFileAuthState(folder)
    }

    fs.mkdirSync(path.dirname(dbPath) || ".", { recursive: true })
    const db = new Database(dbPath)
    db.exec(`
      CREATE TABLE IF NOT EXISTS creds (id TEXT PRIMARY KEY, data TEXT);
      CREATE TABLE IF NOT EXISTS keys (type TEXT, id TEXT, data TEXT, PRIMARY KEY(type, id));
    `)

    
    const splitTypeId = (key) => {
        const i = String(key).indexOf(".")
        if (i < 0) return [key, ""]
        return [key.slice(0, i), key.slice(i + 1)]
    }

    const writeData = (table, id, data) => {
        const json = JSON.stringify(data, BufferJSON.replacer)
        if (table === "creds") {
            db.prepare("INSERT OR REPLACE INTO creds (id, data) VALUES (?, ?)").run("creds", json)
        } else {
            const [type, kid] = splitTypeId(id)
            db.prepare("INSERT OR REPLACE INTO keys (type, id, data) VALUES (?, ?, ?)").run(type, kid, json)
        }
    }
    const readData = (table, id) => {
        try {
            if (table === "creds") {
                const row = db.prepare("SELECT data FROM creds WHERE id = ?").get("creds")
                return row ? JSON.parse(row.data, BufferJSON.reviver) : null
            }
            const [type, kid] = splitTypeId(id)
            const row = db.prepare("SELECT data FROM keys WHERE type = ? AND id = ?").get(type, kid)
            return row ? JSON.parse(row.data, BufferJSON.reviver) : null
        } catch { return null }
    }
    const removeData = (table, id) => {
        if (table === "creds") db.prepare("DELETE FROM creds WHERE id = ?").run("creds")
        else {
            const [type, kid] = splitTypeId(id)
            db.prepare("DELETE FROM keys WHERE type = ? AND id = ?").run(type, kid)
        }
    }

    const creds = readData("creds") || initAuthCreds()

    return {
        state: {
            creds,
            keys: {
                get: async (type, ids) => {
                    const out = {}
                    for (const id of ids) {
                        let v = readData("keys", `${type}.${id}`)
                        if (type === "app-state-sync-key" && v) {
                            v = proto.Message.AppStateSyncKeyData.fromObject(v)
                        }
                        out[id] = v
                    }
                    return out
                },
                set: async (data) => {
                    for (const category in data) {
                        for (const id in data[category]) {
                            const value = data[category][id]
                            const key = `${category}.${id}`
                            if (value) writeData("keys", key, value)
                            else removeData("keys", key)
                        }
                    }
                }
            }
        },
        saveCreds: async () => writeData("creds", "creds", creds)
    }
}

module.exports = { useSQLiteAuthState }
