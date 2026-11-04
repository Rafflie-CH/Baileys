"use strict"
const fs = require("fs")
const path = require("path")

const SAFE_NAME = /^[A-Za-z0-9._@+-]+$/

function assertSafeName(name) {
    if (typeof name !== "string" || !name || name.includes("..") || name.includes("/") || name.includes("\\") || !SAFE_NAME.test(name)) {
        throw new Error("invalid session file name: " + String(name).slice(0, 80))
    }
}

function assertInside(root, target) {
    const r = path.resolve(root)
    const t = path.resolve(target)
    if (t !== r && !t.startsWith(r + path.sep)) {
        throw new Error("path escapes target directory")
    }
}

/** send with retry + boom-aware (skip hard auth errors) */
async function safeSend(sock, jid, content, options = {}, { retries = 3, baseDelay = 800 } = {}) {
    let lastErr
    for (let i = 0; i < retries; i++) {
        try {
            return await sock.sendMessage(jid, content, options)
        } catch (e) {
            lastErr = e
            const code = e?.output?.statusCode || e?.status || 0
            if (code === 401 || code === 403 || code === 440) break
            await new Promise(r => setTimeout(r, baseDelay * Math.pow(1.6, i)))
        }
    }
    throw lastErr
}

/** export multi-file session folder to single json bundle */
async function exportSession(folder, outFile) {
    const bundle = { files: {}, exportedAt: Date.now() }
    if (!fs.existsSync(folder)) throw new Error("session folder missing")
    for (const name of fs.readdirSync(folder)) {
        assertSafeName(name)
        const p = path.join(folder, name)
        if (!fs.statSync(p).isFile()) continue
        bundle.files[name] = fs.readFileSync(p).toString("base64")
    }
    fs.writeFileSync(outFile, JSON.stringify(bundle))
    return outFile
}

/** import bundle into folder — hardened against path traversal */
async function importSession(bundleFile, folder) {
    const bundle = JSON.parse(fs.readFileSync(bundleFile, "utf8"))
    fs.mkdirSync(folder, { recursive: true })
    const root = path.resolve(folder)
    for (const [name, b64] of Object.entries(bundle.files || {})) {
        assertSafeName(name)
        const dest = path.join(root, name)
        assertInside(root, dest)
        fs.writeFileSync(dest, Buffer.from(b64, "base64"), { mode: 0o600 })
    }
    return folder
}

function withTimeout(promise, ms, label = "op") {
    let t
    return Promise.race([
        promise.finally(() => clearTimeout(t)),
        new Promise((_, rej) => { t = setTimeout(() => rej(new Error(`${label} timeout ${ms}ms`)), ms) })
    ])
}

module.exports = { safeSend, exportSession, importSession, withTimeout }
