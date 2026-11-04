# Rafz Baileys — MENTOK (anti-error)

## Auth (lengkap)
- useMultiFileAuthState
- useSingleFileAuthState
- useSQLiteAuthState (optional better-sqlite3)
- useMongoAuthState (optional mongodb collection)
- createMultiAuthManager
- exportSession / importSession

## Unik vs Baileys org
- scheduler · antiDelete (upsert + revoke) · broadcast · commands router
- rvo · mentionAll · sendMiniApp · sendAI · sendSpoiler · sendGroupStatus
- safeSend (retry) · withTimeout · presencePulse · health · jidTools · reactionGuard
- A2UI · vcard · sendContact
- antiban toolkit · withAutoReconnect · auto WA Web version
- WASM optional · voip-rekey · username check

## Messaging parity
buttons · template · list · nativeFlow · carousel · album · sticker pack
poll · pollResult · event · product · order · payment · shop · newsletter (no malware)
LID · groups · community · labels · business · call offer/reject

## Anti-error logic
- safeSend retries (skip 401/403)
- withAutoReconnect (skip loggedOut)
- native-bridge soft load (no crash tanpa WASM)
- sqlite/mongo soft optional peers
- helpers try/catch wrap biar sock tetap hidup

Mentok di lapisan pure-JS + optional peer. Full VoIP media stream engine & wajib-rust tidak dipaksa (bisa error install).
