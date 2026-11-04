const { test } = require('node:test')
const assert = require('node:assert')
const fs = require('fs')
const path = require('path')
const { EventEmitter } = require('events')

const ROOT = path.join(__dirname, '..')

test('entrypoint files exist', () => {
  for (const f of [
    'lib/index.js', 'lib/index.mjs', 'lib/antiban.js',
    'lib/WABinary/index.js', 'lib/Utils/session-pool.js', 'package.json'
  ]) {
    assert.ok(fs.existsSync(path.join(ROOT, f)), 'missing ' + f)
  }
})

test('require lib — enough exports (contract)', () => {
  const lib = require('../lib')
  const keys = Object.keys(lib)
  // Real baseline ~360+; keep floor high so mass-deletion fails CI
  assert.ok(keys.length >= 250, 'export count too low: ' + keys.length)
  const must = ['useMultiFileAuthState', 'DisconnectReason', 'proto', 'Browsers']
  for (const k of must) {
    assert.ok(k in lib || typeof lib[k] !== 'undefined' || (lib.default && k in lib), 'missing export ' + k)
  }
  // soft: default or makeWASocket
  const sockFn = lib.default || lib.makeWASocket
  assert.ok(typeof sockFn === 'function' || typeof lib === 'function')
})

test('session-pool maxRetry + backoff rises', async () => {
  let n = 0
  const times = []
  const makeSocket = async () => {
    n++
    times.push(Date.now())
    const sock = new EventEmitter()
    sock.ev = sock
    sock.end = () => {}
    setTimeout(() => sock.emit('connection.update', {
      connection: 'close',
      lastDisconnect: { error: { output: { statusCode: 428 } } }
    }), 12)
    return sock
  }
  const { createSessionPool } = require('../lib/Utils/session-pool')
  const pool = createSessionPool(makeSocket, { reconnectDelayMs: 50, maxDelayMs: 400, maxRetry: 3 })
  await pool.start('t', {})
  await new Promise(r => setTimeout(r, 1200))
  pool.stopAll()
  assert.ok(n <= 5, 'expected <=5 connections, got ' + n)
  if (times.length >= 3) {
    const gaps = []
    for (let i = 1; i < times.length; i++) gaps.push(times[i] - times[i - 1])
    // at least one gap should be larger than the first (backoff)
    const rising = gaps.some((g, i) => i > 0 && g > gaps[0] * 1.15)
    assert.ok(rising || gaps.length < 2, 'backoff gaps should rise: ' + gaps.join(','))
  }
})

test('multi-file auth writes mode 600', async () => {
  const os = require('os')
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rafz-auth-'))
  const { useMultiFileAuthState } = require('../lib/Utils/use-multi-file-auth-state')
  const { state, saveCreds } = await useMultiFileAuthState(dir)
  await saveCreds()
  const creds = path.join(dir, 'creds.json')
  assert.ok(fs.existsSync(creds), 'creds.json missing')
  const mode = fs.statSync(creds).mode & 0o777
  assert.equal(mode, 0o600, 'expected mode 600, got ' + mode.toString(8))
})
