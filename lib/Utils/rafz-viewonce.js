"use strict"
const fs = require("fs")
const path = require("path")
const { downloadMediaMessage } = require("./messages-media")

/**
 * Auto-download view-once media to disk as soon as message arrives
 * (before sender app can mark opened).
 * @param {import('../Types').WASocket} sock
 * @param {{ cacheDir?: string }} opts
 * @returns {() => void} stop
 */
function autoCacheViewOnce(sock, opts = {}) {
    const cacheDir = opts.cacheDir || path.join(process.cwd(), "viewonce-cache")
    fs.mkdirSync(cacheDir, { recursive: true })
    const handler = async (upsert) => {
        try {
            for (const msg of upsert.messages || []) {
                const content = msg.message
                if (!content) continue
                const vo = content.viewOnceMessage || content.viewOnceMessageV2 || content.viewOnceMessageV2Extension
                const inner = vo?.message || content
                const hasMedia = inner?.imageMessage || inner?.videoMessage || inner?.audioMessage
                if (!hasMedia || !vo) continue
                const id = msg.key?.id || String(Date.now())
                const buffer = await downloadMediaMessage(msg, "buffer", {}, { logger: sock.logger, reuploadRequest: sock.updateMediaMessage })
                const ext = inner.imageMessage ? "jpg" : inner.videoMessage ? "mp4" : "ogg"
                const file = path.join(cacheDir, `${id}.${ext}`)
                fs.writeFileSync(file, buffer)
            }
        } catch (_) {}
    }
    sock.ev.on("messages.upsert", handler)
    return () => sock.ev.off("messages.upsert", handler)
}

module.exports = { autoCacheViewOnce }
