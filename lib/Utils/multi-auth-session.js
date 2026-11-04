"use strict"
const path = require("path")
const fs = require("fs")
const { useMultiFileAuthState } = require("./use-multi-file-auth-state")
const { makeCacheableSignalKeyStore } = require("./auth-utils")

function assertSafeSessionId(id) {
    if (typeof id !== "string" || !id || id.includes("..") || /[\/\\]/.test(id) || !/^[A-Za-z0-9._@+-]+$/.test(id)) {
        throw new Error("invalid session id")
    }
}

/**
 * Multi-auth session manager — multiple WhatsApp accounts in parallel.
 * @param {string} baseDir
 * @param {{ logger?: any }} opts
 */
function createMultiAuthManager(baseDir, opts = {}) {
    const logger = opts.logger
    fs.mkdirSync(baseDir, { recursive: true })
    const sessions = new Map()

    async function open(id) {
        assertSafeSessionId(id)
        if (sessions.has(id)) return sessions.get(id)
        const dir = path.join(baseDir, id)
        fs.mkdirSync(dir, { recursive: true })
        const { state, saveCreds } = await useMultiFileAuthState(dir)
        const entry = {
            id,
            dir,
            state: {
                ...state,
                keys: makeCacheableSignalKeyStore(state.keys, logger)
            },
            saveCreds
        }
        sessions.set(id, entry)
        return entry
    }

    function list() {
        return [...sessions.keys()]
    }

    function remove(id) {
        assertSafeSessionId(id)
        sessions.delete(id)
        // does not delete disk folder — caller decides
    }

    return { open, list, remove, assertSafeSessionId }
}

module.exports = { createMultiAuthManager }
