const { test } = require('node:test')
const assert = require('node:assert')
const { EventEmitter } = require('events')

// Isolated process — do NOT require('../lib') first (async-mutex pollutes globalThis.__importStar)
test('QR listener loads qrcode-terminal without false dependency error', async () => {
  let errMsg = null
  const logger = {
    error: (m) => { errMsg = typeof m === 'string' ? m : (m && m.msg) || String(m) },
    info() {}, debug() {}, warn() {}, trace() {}, child() { return this }
  }
  const g = require('../lib/Utils/generics')
  const fn = g.printQRIfNecessaryListener
  assert.equal(typeof fn, 'function', 'printQRIfNecessaryListener missing')
  const ev = new EventEmitter()
  fn(ev, logger)
  ev.emit('connection.update', { qr: 'test-qr-payload' })
  await new Promise(r => setTimeout(r, 200))
  assert.ok(
    !errMsg || !String(errMsg).includes('not added as dependency'),
    'false QR dependency error: ' + errMsg
  )
})
