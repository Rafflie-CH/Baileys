"use strict"
const { DisconnectReason } = require("../Types")
const { Boom } = require("@hapi/boom")

/**
 * Wire standard anti-connection-close reconnect loop.
 * Does not auto-reconnect on loggedOut.
 * @param {() => Promise<any>|any} makeSocketFn function that returns a sock
 * @param {{ maxRetries?: number, baseDelayMs?: number, logger?: any }} opts
 */
function withAutoReconnect(makeSocketFn, opts = {}) {
    const maxRetries = opts.maxRetries ?? Infinity
    const baseDelayMs = opts.baseDelayMs ?? 2000
    const logger = opts.logger
    let retries = 0
    let stopped = false
    let current = null

    const start = async () => {
        if (stopped) return null
        current = await makeSocketFn()
        current.ev.on("connection.update", async (update) => {
            const { connection, lastDisconnect } = update
            if (connection !== "close") {
                if (connection === "open") retries = 0
                return
            }
            const code = (lastDisconnect?.error instanceof Boom)
                ? lastDisconnect.error.output?.statusCode
                : lastDisconnect?.error?.output?.statusCode
            const loggedOut = code === DisconnectReason.loggedOut
            if (loggedOut || stopped) return
            if (retries >= maxRetries) {
                logger?.error?.({ code, retries }, "rafz reconnect: max retries")
                return
            }
            const delay = Math.min(baseDelayMs * Math.pow(1.5, retries) + Math.random() * 500, 30000)
            retries += 1
            logger?.warn?.({ code, retries, delay }, "rafz reconnect: scheduling")
            await new Promise(r => setTimeout(r, delay))
            try { await start() } catch (e) { logger?.error?.({ e }, "rafz reconnect failed") }
        })
        return current
    }

    return {
        start,
        stop: () => { stopped = true },
        get sock() { return current }
    }
}

module.exports = { withAutoReconnect }
