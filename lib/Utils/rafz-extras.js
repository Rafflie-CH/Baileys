"use strict"
const { jidNormalizedUser, isJidGroup, isJidBroadcast } = require("../WABinary")

/** Simple in-process message scheduler */
function createMessageScheduler(sock) {
    const jobs = new Map()
    let seq = 0
    return {
        schedule(jid, content, at, options = {}) {
            const id = options.id || `job_${Date.now()}_${++seq}`
            const delay = Math.max(0, (at instanceof Date ? at.getTime() : +at) - Date.now())
            const timer = setTimeout(async () => {
                jobs.delete(id)
                try { await sock.sendMessage(jid, content, options) } catch (_) {}
            }, delay)
            jobs.set(id, { timer, jid, at })
            return id
        },
        cancel(id) {
            const j = jobs.get(id)
            if (!j) return false
            clearTimeout(j.timer)
            jobs.delete(id)
            return true
        },
        list() { return [...jobs.entries()].map(([id, j]) => ({ id, jid: j.jid, at: j.at })) }
    }
}

/** Anti-delete: keep recent messages so deleted ones can be recovered */
function createAntiDelete(sock, { max = 500, store = new Map() } = {}) {
    const keyOf = (m) => `${m.key?.remoteJid}|${m.key?.id}|${m.key?.fromMe ? 1 : 0}`
    const onUpsert = ({ messages }) => {
        for (const m of messages || []) {
            if (!m?.message || !m.key?.id) continue
            store.set(keyOf(m), { message: m, ts: Date.now() })
            if (store.size > max) {
                const first = store.keys().next().value
                store.delete(first)
            }
        }
    }
    sock.ev.on("messages.upsert", onUpsert)
    const deleted = []
    const onUpdate = (updates) => {
        for (const u of updates || []) {
            if (u.update?.message === null || u.update?.messageStubType === 1 || u.update?.status === 0) {
                const hit = store.get(`${u.key?.remoteJid}|${u.key?.id}|${u.key?.fromMe ? 1 : 0}`)
                if (hit) deleted.push({ key: u.key, originalMessage: hit.message })
            }
        }
        return deleted.splice(0, deleted.length)
    }
    sock.ev.on("messages.update", onUpdate)
    return {
        get(key) { return store.get(`${key.remoteJid}|${key.id}|${key.fromMe ? 1 : 0}`) },
        restore: async (key, toJid) => {
            const hit = store.get(`${key.remoteJid}|${key.id}|${key.fromMe ? 1 : 0}`)
            if (!hit) return null
            return sock.sendMessage(toJid || key.remoteJid, { forward: hit.message })
        },
        stop() { sock.ev.off("messages.upsert", onUpsert); sock.ev.off("messages.update", onUpdate) },
        pullDeleted: onUpdate,
        size: () => store.size
    }
}

/** Broadcast text/media to many jids with delay */
async function broadcast(sock, jids, content, { delayMs = 1500, onProgress } = {}) {
    const results = []
    for (let i = 0; i < jids.length; i++) {
        const jid = jids[i]
        try {
            const r = await sock.sendMessage(jid, content)
            results.push({ jid, ok: true, id: r?.key?.id })
        } catch (e) {
            results.push({ jid, ok: false, error: String(e && e.message || e) })
        }
        if (onProgress) onProgress(i + 1, jids.length)
        if (i < jids.length - 1 && delayMs > 0) await new Promise(r => setTimeout(r, delayMs))
    }
    return results
}

/** JID helpers */
const jidTools = {
    toUser: (jid) => jidNormalizedUser(jid),
    isGroup: (jid) => isJidGroup(jid),
    isStatus: (jid) => jid === "status@broadcast" || isJidBroadcast(jid),
    phoneOf: (jid) => String(jid || "").split("@")[0].split(":")[0],
    lidGuess: (pn) => `${String(pn).replace(/\D/g, "")}@lid`
}

/** Presence pulse (online/typing/paused) */
async function presencePulse(sock, jid, { typingMs = 2000 } = {}) {
    try {
        await sock.sendPresenceUpdate("composing", jid)
        await new Promise(r => setTimeout(r, typingMs))
        await sock.sendPresenceUpdate("paused", jid)
    } catch (_) {}
}

/** Health snapshot */
function healthSnapshot(sock) {
    return {
        user: sock.user,
        ws: sock.ws?.readyState,
        lastPing: sock.lastPing || null,
        timestamp: Date.now()
    }
}

module.exports = {
    createMessageScheduler,
    createAntiDelete,
    broadcast,
    jidTools,
    presencePulse,
    healthSnapshot
}
