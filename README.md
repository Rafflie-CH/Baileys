<h1 align="center">
  <img src="https://raw.githubusercontent.com/WhiskeySockets/Baileys/master/Media/logo.png" height="75" alt="Baileys"/>
  <br/>
  <b>@rafz/baileys</b>
</h1>

<p align="center">
  Library WhatsApp Web multi-device berbasis WebSocket (fork all-in dari Baileys).<br/>
  <b>CJS + ESM</b> · interaktif penuh · multi-auth · anti-error · <b>tanpa auto-follow malware</b>
</p>

<p align="center">
  <a href="https://t.me/Rafzhost">Telegram Info</a> ·
  <a href="https://t.me/Rafzbotz">Akun Utama</a> ·
  <a href="https://t.me/rafzch">Testimoni & Produk</a>
</p>

---

## Install

```bash
# langsung dari repo (disarankan)
npm install github:Rafflie-CH/Baileys
# atau
yarn add github:Rafflie-CH/Baileys
```

`package.json`:

```json
{
  "dependencies": {
    "baileys": "github:Rafflie-CH/Baileys"
  }
}
```

Opsional:

```bash
npm i jimp link-preview-js
npm i better-sqlite3          # auth SQLite
npm i mongodb                 # auth Mongo
npm i whatsapp-rust-bridge@0.5.4   # WASM opsional
```

### Import CJS

```js
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('baileys')
// atau
const { default: makeWASocket } = require('@rafz/baileys')
```

### Import ESM

```js
import makeWASocket, { useMultiFileAuthState, DisconnectReason } from 'baileys'
```

---

## Perbandingan fitur

| Fitur | Org Baileys | Fork lain (umum) | **Rafz** |
|---|:---:|:---:|:---:|
| Button / list / nativeFlow / carousel | partial | sering | **penuh** |
| Album · sticker pack · poll result · event | partial | bervariasi | **penuh** |
| Product · order · payment | partial | bervariasi | **penuh** |
| Newsletter media | sering error | bervariasi | **fixed** |
| Auto-follow channel (malware) | — | **ada di beberapa** | **tidak ada** |
| Auto fetch WA Web version | manual | jarang | **otomatis** |
| Multi-file auth | ya | ya | ya |
| Single-file / SQLite / Mongo auth | — | sebagian | **ya** |
| Multi-session manager | — | jarang | **ya** |
| Scheduler · anti-delete · broadcast | — | sebagian | **ya** |
| Command router · rvo · mentionAll | — | jarang | **ya** |
| A2UI · richMenu · sendAI · spoiler · miniApp | — | jarang | **ya** |
| Username / LID protocol | partial | sebagian | **ya** |
| safeSend retry · withAutoReconnect | — | jarang | **ya** |
| WASM optional | — | jarang | **ya** |
| CJS + ESM dual export | — | jarang | **ya** |

Tidak ada fitur inti yang dihapus dibanding build Rafz sebelumnya — semua helper (`scheduler`, `antiDelete`, `broadcast`, `commands`, `rvo`, `mentionAll`, `sendMiniApp`, `sendAI`, `sendSpoiler`, `sendGroupStatus`, `safeSend`, `exportSession`, `A2UI`, multi-auth, dll.) tetap ada.

---

## Mulai cepat

```js
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers } = require('baileys')
const { Boom } = require('@hapi/boom')

async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys')
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
    browser: Browsers.ubuntu('Chrome')
    // version WA Web di-fetch otomatis — tidak wajib diisi
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update
    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error instanceof Boom)
        ? lastDisconnect.error.output?.statusCode !== DisconnectReason.loggedOut
        : true
      console.log('connection closed', lastDisconnect?.error, 'reconnect', shouldReconnect)
      if (shouldReconnect) connectToWhatsApp()
    } else if (connection === 'open') {
      console.log('opened connection', sock.user?.id)
    }
  })

  sock.ev.on('messages.upsert', async (event) => {
    for (const m of event.messages) {
      if (!m.message || m.key.fromMe) continue
      await sock.sendMessage(m.key.remoteJid, { text: 'Hello dari Rafz' }, { quoted: m })
    }
  })
}

connectToWhatsApp()
```

### Pairing code

### Pairing code kustom

```js
// kode 8 karakter buatan sendiri (lebih mudah diingat)
const code = await sock.requestPairingCode('628xxxxxxxxxx', 'RAFZ2026')
console.log('pairing:', code) // RAFZ2026

// atau biarkan random aman (default, tanpa watermark)
const code2 = await sock.requestPairingCode('628xxxxxxxxxx')
```



```js
const sock = makeWASocket({ auth: state, printQRInTerminal: false })
if (!sock.authState.creds.registered) {
  const code = await sock.requestPairingCode('628xxxxxxxxxx') // tanpa + atau spasi
  console.log('pairing code:', code)
}
```

### Full history

```js
const sock = makeWASocket({
  auth: state,
  browser: Browsers.macOS('Desktop'),
  syncFullHistory: true
})
```

### Auto reconnect (helper Rafz)

```js
const { withAutoReconnect, default: makeWASocket, useMultiFileAuthState } = require('baileys')

const runner = withAutoReconnect(async () => {
  const { state, saveCreds } = await useMultiFileAuthState('auth')
  const sock = makeWASocket({ auth: state, printQRInTerminal: true })
  sock.ev.on('creds.update', saveCreds)
  return sock
})
await runner.start()
```

---

## Catatan konfigurasi socket

### Cache group metadata (disarankan)

```js
const NodeCache = require('node-cache')
const groupCache = new NodeCache({ stdTTL: 5 * 60, useClones: false })

const sock = makeWASocket({
  cachedGroupMetadata: async (jid) => groupCache.get(jid)
})

sock.ev.on('groups.update', async ([event]) => {
  const metadata = await sock.groupMetadata(event.id)
  groupCache.set(event.id, metadata)
})
sock.ev.on('group-participants.update', async (event) => {
  const metadata = await sock.groupMetadata(event.id)
  groupCache.set(event.id, metadata)
})
```

### Retry & decrypt poll

```js
const sock = makeWASocket({
  getMessage: async (key) => getMessageFromStore(key) // implementasi store kamu
})
```

### Notifikasi tetap di HP

```js
const sock = makeWASocket({ markOnlineOnConnect: false })
```

---

## Auth / session

```js
// multi-file (standar)
const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys')

// satu file JSON
const { state, saveCreds } = await useSingleFileAuthState('./auth.json')

// SQLite
const { state, saveCreds } = await useSQLiteAuthState('./auth.db')

// MongoDB
const { state, saveCreds } = await useMongoAuthState(collection, 'session-bot1')

// multi akun
const { createMultiAuthManager } = require('baileys')
const mgr = createMultiAuthManager('./sessions')
const s1 = await mgr.open('bot1')
const s2 = await mgr.open('bot2')

// backup / pindah mesin
await sock.exportSession('./auth', './backup.json')
await sock.importSession('./backup.json', './auth-restored')
```

> Simpan selalu pada `creds.update`. Key Signal ikut berubah saat kirim/terima pesan.

---

## Event

```js
sock.ev.on('messages.upsert', ({ messages, type }) => { })
sock.ev.on('messages.update', (updates) => { })
sock.ev.on('messages.delete', (item) => { })
sock.ev.on('messages.reaction', (reactions) => { })
sock.ev.on('presence.update', console.log)
sock.ev.on('chats.upsert', console.log)
sock.ev.on('chats.update', console.log)
sock.ev.on('contacts.upsert', console.log)
sock.ev.on('groups.update', console.log)
sock.ev.on('group-participants.update', console.log)
sock.ev.on('connection.update', console.log)
sock.ev.on('creds.update', saveCreds)
sock.ev.on('call', console.log)
sock.ev.on('messaging-history.set', console.log)
```

### Decrypt poll votes

```js
sock.ev.on('messages.update', async (event) => {
  for (const { key, update } of event) {
    if (update.pollUpdates) {
      const pollCreation = await getMessage(key)
      if (pollCreation) {
        console.log(getAggregateVotesInPollMessage({
          message: pollCreation,
          pollUpdates: update.pollUpdates
        }))
      }
    }
  }
})
```

---

## Store (in-memory)

```js
const { makeInMemoryStore } = require('baileys')
const store = makeInMemoryStore({})
store.readFromFile('./baileys_store.json')
setInterval(() => store.writeToFile('./baileys_store.json'), 10_000)

const sock = makeWASocket({ auth: state })
store.bind(sock.ev)
```

---

## Kirim pesan (standar)

```js
await sock.sendMessage(jid, { text: 'hello' })
await sock.sendMessage(jid, { text: 'quote' }, { quoted: message })
await sock.sendMessage(jid, { text: '@628xxx', mentions: ['628xxx@s.whatsapp.net'] })
await sock.sendMessage(jid, { forward: msg })
await sock.sendMessage(jid, { location: { degreesLatitude: -6.2, degreesLongitude: 106.8 } })
await sock.sendMessage(jid, {
  contacts: {
    displayName: 'Nama',
    contacts: [{ vcard: 'BEGIN:VCARD\nVERSION:3.0\nFN:Nama\nTEL;type=CELL;type=VOICE;waid=628xxx:+628xxx\nEND:VCARD' }]
  }
})
await sock.sendMessage(jid, { react: { text: '👍', key: message.key } })
await sock.sendMessage(jid, {
  poll: { name: 'Poll', values: ['A', 'B'], selectableCount: 1 }
})
```

### Media

```js
await sock.sendMessage(jid, { image: { url: './img.jpg' }, caption: 'cap' })
await sock.sendMessage(jid, { video: { url: './v.mp4' }, caption: 'vid', gifPlayback: false })
await sock.sendMessage(jid, { audio: { url: './a.ogg' }, mimetype: 'audio/ogg; codecs=opus', ptt: true })
await sock.sendMessage(jid, { document: { url: './f.pdf' }, mimetype: 'application/pdf', fileName: 'f.pdf' })
await sock.sendMessage(jid, { image: { url: './img.jpg' }, viewOnce: true, caption: 'sekali lihat' })
```

### Edit & hapus

```js
const sent = await sock.sendMessage(jid, { text: 'lama' })
await sock.sendMessage(jid, { text: 'baru', edit: sent.key })
await sock.sendMessage(jid, { delete: sent.key })
```

### Download media

```js
const { downloadMediaMessage, getContentType } = require('baileys')
const stream = await downloadMediaMessage(m, 'stream', {}, {
  reuploadRequest: sock.updateMediaMessage
})
```

---

## Interaktif & rich (Rafz)

```js
// buttons
await sock.sendButtons(jid, {
  text: 'Pilih menu',
  footer: 'Rafz',
  buttons: [
    { buttonId: 'a', buttonText: { displayText: 'Menu A' }, type: 1 },
    { buttonId: 'b', buttonText: { displayText: 'Menu B' }, type: 1 }
  ]
})

// list
await sock.sendList(jid, {
  text: 'Katalog', title: 'List', buttonText: 'Buka', footer: 'Rafz',
  sections: [{ title: 'S1', rows: [{ title: 'Item 1', rowId: 'i1', description: 'desc' }] }]
})

// carousel
await sock.sendCarousel(jid, {
  text: 'Promo',
  cards: [{
    image: { url: './1.jpg' },
    title: 'Kartu 1',
    body: 'Deskripsi',
    buttons: [{ name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: 'OK', id: 'ok' }) }]
  }]
})

// rich menu
await sock.richMenu(jid, {
  header: { title: 'Header', image: { url: './h.jpg' } },
  body: { title: 'Pilih', buttons: ['A', 'B', 'C'] },
  footer: { text: 'Buka web', url: 'https://example.com' }
})

// album / poll / event
await sock.sendAlbum(jid, [
  { image: { url: './1.jpg' }, caption: '1' },
  { video: { url: './2.mp4' }, caption: '2' }
])
await sock.sendPoll(jid, 'Warna?', ['Merah', 'Biru'], { selectableCount: 1 })
await sock.sendEvent(jid, { name: 'Meetup', startTime: Math.floor(Date.now() / 1000) + 3600 })

// teks kaya
await sock.sendTable(jid, { title: 'Rekap', rows: [['A', '1'], ['B', '2']] })
await sock.sendCodeBlock(jid, { language: 'js', code: 'console.log(1)' })
await sock.sendHtml(jid, '<b>tebal</b>')
await sock.sendLatex(jid, 'E = mc^2')
await sock.sendAI(jid, { text: 'jawaban AI' })
await sock.sendSpoiler(jid, { text: 'rahasia' })
await sock.sendMiniApp(jid, { title: 'Buka App', body: 'Klik', url: 'https://app.example' })
```

### A2UI

```js
const { A2UI } = require('baileys')
const ui = new A2UI()
const t = ui.text('Judul', { variant: 'title' })
ui.root([t, ui.button(ui.text('OK'), { action: { name: 'ok' } })])
await sock.sendA2UI(jid, { a2ui: ui, bodyText: 'Form' })
```

---

## Fitur unik Rafz

```js
// scheduler
const jobId = sock.scheduler.schedule(jid, { text: 'reminder' }, Date.now() + 60_000)
// sock.scheduler.cancel(jobId)

// anti-delete
sock.ev.on('messages.update', () => {
  for (const d of sock.antiDelete.pullDeleted?.() || []) {
    console.log('terhapus', d.key)
    // await sock.antiDelete.restore(d.key, d.key.remoteJid)
  }
})

// broadcast berjarak
await sock.broadcast([jid1, jid2], { text: 'info' }, { delayMs: 1500 })

// mention semua member
await sock.mentionAll(groupJid, 'halo semua')

// buka view-once
await sock.rvo(pesanViewOnce)

// command router
const cmd = sock.commands({ prefix: '.', owners: ['628xxx@s.whatsapp.net'] })
cmd.on('ping', async ({ reply }) => reply('pong'))

// kontak · presence · health · safeSend
await sock.sendContact(jid, [{ name: 'Rafz', phone: '628xxxxxxxxxx' }])
await sock.presencePulse(jid, { typingMs: 2000 })
console.log(sock.health())
await sock.safeSend(jid, { text: 'penting' }, {}, { retries: 3, baseDelay: 800 })
```

---

## Call

```js
await sock.offerCall(jid, false) // voice
await sock.rejectCall(callId, callFrom)
// event: sock.ev.on('call', console.log)
```

---

## Newsletter / Channel

```js
await sock.newsletterCreate('Nama Channel', 'deskripsi')
await sock.newsletterFollow('123@newsletter')
await sock.newsletterUnfollow('123@newsletter')
await sock.newsletterMetadata('jid', '123@newsletter')
await sock.sendMessage('123@newsletter', { image: { url: './a.jpg' }, caption: 'post' })
```

> **Tidak ada auto-follow channel tersembunyi.**

---

## Username & LID

```js
await sock.checkUsername('someone')
await sock.checkUsernameMulti(['a', 'b'])
await sock.onWhatsApp('628xxx@s.whatsapp.net')
```

---

## Group

```js
const group = await sock.groupCreate('My Group', ['628xxx@s.whatsapp.net'])
await sock.groupParticipantsUpdate(gid, ['628xxx@s.whatsapp.net'], 'add') // remove | promote | demote
await sock.groupUpdateSubject(gid, 'Nama baru')
await sock.groupUpdateDescription(gid, 'Deskripsi')
await sock.groupSettingUpdate(gid, 'announcement') // not_announcement | locked | unlocked
await sock.groupLeave(gid)
const code = await sock.groupInviteCode(gid)
await sock.groupAcceptInvite(code)
await sock.groupMetadata(gid)
await sock.groupFetchAllParticipating()
await sock.groupToggleEphemeral(gid, 86400)
await sock.groupMemberAddMode(gid, 'all_member_add') // admin_add
await sock.sendGroupStatus(gid, { text: 'status di grup' })
```

---

## Privacy & chat modify

```js
await sock.updateBlockStatus(jid, 'block') // unblock
await sock.fetchBlocklist()
await sock.fetchPrivacySettings(true)
await sock.updateLastSeenPrivacy('all') // contacts | none
await sock.updateOnlinePrivacy('all')
await sock.updateProfilePicturePrivacy('all')
await sock.updateStatusPrivacy('all')
await sock.updateReadReceiptsPrivacy('all')
await sock.updateGroupsAddPrivacy('all')
await sock.updateDefaultDisappearingMode(86400)

await sock.chatModify({ archive: true, lastMessages: [lastMsg] }, jid)
await sock.chatModify({ mute: 8 * 60 * 60 * 1000 }, jid)
await sock.chatModify({ pin: true }, jid)
await sock.readMessages([key])
await sock.sendPresenceUpdate('available', jid)
```

---

## Profile

```js
await sock.updateProfileStatus('Status baru')
await sock.updateProfileName('Nama')
await sock.updateProfilePicture(jid, { url: './pp.jpg' })
await sock.removeProfilePicture(jid)
await sock.profilePictureUrl(jid, 'image')
await sock.fetchStatus(jid)
await sock.getBusinessProfile(jid)
```

---

## Stories / broadcast

```js
await sock.sendMessage(
  'status@broadcast',
  { image: { url: './a.jpg' }, caption: 'story' },
  { statusJidList: [jid1, jid2], backgroundColor: '#000000', font: 0 }
)
```

---

## WASM (opsional)

```bash
npm i whatsapp-rust-bridge@0.5.4
```

```js
const { loadRustBridge } = require('baileys')
const bridge = loadRustBridge() // null jika belum terpasang — bot tetap jalan
```

---

## Antiban toolkit

```js
const { AntiBan, wrapSocket, PRESETS } = require('baileys')
// RateLimiter, PresenceChoreographer, SessionHealthMonitor — lihat lib/antiban.js
```

---

## Utility

```js
const {
  getContentType,
  downloadContentFromMessage,
  downloadMediaMessage,
  generateWAMessageFromContent,
  makeCacheableSignalKeyStore,
  fetchLatestWaWebVersion,
  jidNormalizedUser,
  isJidGroup,
  BufferJSON,
  proto
} = require('baileys')
```

---

## Custom websocket callback

```js
sock.ws.on('CB:edge_routing', (node) => { })
sock.ws.on('CB:edge_routing,id:abcd', (node) => { })
```

---

## Struktur repo

```
lib/
  Socket/     # makeWASocket chain
  Utils/      # auth, a2ui, rafz-extras, safe, reconnect, native-bridge
  WAUSync/    # USync protocols (business, picture, username, LID, ...)
  Store/
  Types/
  WABinary/
  Signal/
  antiban.js
  index.js    # CJS
  index.mjs   # ESM
WAProto/
package.json
README.md
FEATURES.md
```

---

## Disclaimer

Tidak terafiliasi dengan WhatsApp. Gunakan bertanggung jawab sesuai ToS WhatsApp. Tidak ada auto-subscribe channel / payload tersembunyi di build ini.

---

<p align="center">
  <b>Rafz</b> · t.me/Rafzhost · t.me/Rafzbotz · t.me/rafzch
</p>
