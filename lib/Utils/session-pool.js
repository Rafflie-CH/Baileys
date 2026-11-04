"use strict"
/**
 * Session pool — loggedOut stop, backoff + maxRetry, flapping guard
 */
function createSessionPool(makeSocket, options = {}) {
    const sessions = new Map()
    const attemptMap = new Map()
    const logger = options.logger || { warn() {}, info() {}, debug() {}, error() {} }
    const stableMs = options.stableMs ?? 10_000

    async function start(id, authState, sockOptions = {}) {
        if (sessions.has(id)) {
            const old = sessions.get(id)
            old.dead = true
            if (old.timer) clearTimeout(old.timer)
            try { old.sock?.ev?.off?.("connection.update", old._onClose) } catch (_) {}
            try { old.sock?.end?.() } catch (_) {}
        }
        const gen = Date.now()
        const e = {
            id,
            gen,
            dead: false,
            timer: null,
            sock: null,
            authState,
            sockOptions,
            openedAt: null
        }
        sessions.set(id, e)
        const sock = await makeSocket({ ...sockOptions, auth: authState })
        e.sock = sock

        const onClose = (update) => {
            if (!update) return
            if (update.connection === "open") {
                e.openedAt = Date.now()
                return
            }
            if (update.connection !== "close") return
            if (e.dead || sessions.get(id)?.gen !== gen) return
            // only reset attempts if session was stably open
            if (e.openedAt && Date.now() - e.openedAt >= stableMs) {
                attemptMap.set(id, 0)
            }
            e.openedAt = null
            const code = update?.lastDisconnect?.error?.output?.statusCode
                || update?.lastDisconnect?.error?.status
                || 0
            if (code === 401 || code === 403) {
                e.dead = true
                sessions.delete(id)
                attemptMap.delete(id)
                return
            }
            const maxRetry = options.maxRetry ?? 20
            const attempts = (attemptMap.get(id) || 0) + 1
            attemptMap.set(id, attempts)
            if (attempts > maxRetry) {
                e.dead = true
                sessions.delete(id)
                logger.warn?.({ id, attempts }, "pool max retry reached")
                return
            }
            const base = options.reconnectDelayMs ?? 3000
            const delay = Math.min(base * Math.pow(1.5, Math.min(attempts, 8)), options.maxDelayMs ?? 60000)
            if (e.timer) clearTimeout(e.timer)
            e.timer = setTimeout(() => {
                if (e.dead || sessions.get(id)?.gen !== gen) return
                start(id, authState, sockOptions).catch(err => logger.warn?.({ err, id }, "pool reconnect failed"))
            }, delay)
        }
        sock.ev?.on?.("connection.update", onClose)
        e._onClose = onClose
        return sock
    }

    function remove(id) {
        const e = sessions.get(id)
        if (!e) return false
        e.dead = true
        if (e.timer) clearTimeout(e.timer)
        e.timer = null
        try { e.sock?.ev?.off?.("connection.update", e._onClose) } catch (_) {}
        try { e.sock?.end?.() } catch (_) {}
        sessions.delete(id)
        attemptMap.delete(id)
        return true
    }

    function get(id) {
        const e = sessions.get(id)
        return e && !e.dead ? e.sock : null
    }

    function list() {
        return [...sessions.keys()].filter(id => !sessions.get(id)?.dead)
    }

    function stopAll() {
        for (const id of [...sessions.keys()]) remove(id)
    }

    return { start, remove, get, list, stopAll }
}

module.exports = { createSessionPool }
