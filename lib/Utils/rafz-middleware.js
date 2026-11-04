"use strict"

/**
 * Simple command router middleware for messages.upsert
 * @param {object} sock
 * @param {{ prefix?: string, owners?: string[] }} conf
 */
function createCommandRouter(sock, conf = {}) {
    const prefix = conf.prefix ?? "."
    const owners = new Set((conf.owners || []).map(String))
    const handlers = new Map()

    function on(cmd, fn) {
        handlers.set(String(cmd).toLowerCase(), fn)
        return this
    }

    const listener = async (upsert) => {
        if (upsert.type !== "notify" && upsert.type !== "append") return
        for (const m of upsert.messages || []) {
            try {
                if (m.key?.fromMe) continue
                const text = m.message?.conversation
                    || m.message?.extendedTextMessage?.text
                    || m.message?.imageMessage?.caption
                    || ""
                if (!text.startsWith(prefix)) continue
                const [raw, ...args] = text.slice(prefix.length).trim().split(/\s+/)
                const cmd = (raw || "").toLowerCase()
                const fn = handlers.get(cmd)
                if (!fn) continue
                const jid = m.key.remoteJid
                const sender = m.key.participant || m.key.remoteJid
                const isOwner = owners.has(sender) || owners.has(sender?.split("@")[0])
                await fn({ sock, m, jid, sender, args, text, isOwner, reply: (c) => sock.sendMessage(jid, typeof c === "string" ? { text: c } : c, { quoted: m }) })
            } catch (_) {}
        }
    }
    sock.ev.on("messages.upsert", listener)
    return {
        on,
        stop() { sock.ev.off("messages.upsert", listener) }
    }
}

/** Build vCard string */
function buildVCard({ name, phone, org, email }) {
    const n = name || phone || "Contact"
    const tel = String(phone || "").replace(/\D/g, "")
    return [
        "BEGIN:VCARD",
        "VERSION:3.0",
        `FN:${n}`,
        `ORG:${org || ""}`,
        `TEL;type=CELL;type=VOICE;waid=${tel}:+${tel}`,
        email ? `EMAIL:${email}` : "",
        "END:VCARD"
    ].filter(Boolean).join("\n")
}

/** Rate-limit reactions */
function createReactionGuard({ maxPerMinute = 20 } = {}) {
    const hits = []
    return {
        allow() {
            const now = Date.now()
            while (hits.length && now - hits[0] > 60000) hits.shift()
            if (hits.length >= maxPerMinute) return false
            hits.push(now)
            return true
        }
    }
}

module.exports = { createCommandRouter, buildVCard, createReactionGuard }
