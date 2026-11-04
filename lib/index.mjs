/**
 * ESM entry — re-export CJS surface (Node >= 18)
 */
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const cjs = require('./index.js')

const makeWASocket = cjs.default ?? cjs.makeWASocket ?? cjs
export default makeWASocket
export { makeWASocket }

const names = [
  'useMultiFileAuthState','useSingleFileAuthState','useSQLiteAuthState','useMongoAuthState',
  'createMultiAuthManager','createSessionPool','makeInMemoryStore','makeCacheableSignalKeyStore',
  'DisconnectReason','Browsers','downloadMediaMessage','downloadContentFromMessage',
  'generateWAMessageFromContent','generateWAMessage','generateWAMessageContent','getContentType',
  'getAggregateVotesInPollMessage','proto','BufferJSON','initAuthCreds',
  'fetchLatestWaWebVersion','fetchLatestBaileysVersion','withAutoReconnect','loadRustBridge',
  'A2UI','sendA2UIWidget','createMessageScheduler','createAntiDelete','broadcast','jidTools',
  'presencePulse','healthSnapshot','createCommandRouter','createCommandHandler','buildVCard',
  'createReactionGuard','safeSend','exportSession','importSession','withTimeout',
  'AntiBan','wrapSocket','PRESETS','delay','isJidGroup','isJidBroadcast','isJidNewsletter',
  'jidNormalizedUser','getBinaryNodeChild','WAMessageStubType','WAProto',
  'autoCacheViewOnceMedia','getViewOnceContent','decodeE2eRekeyPayload','decryptMsmsgBotMessage',
  'buildRichMessageContent'
]
for (const n of names) {
  if (cjs[n] !== undefined) {
    // re-bind below via explicit exports for static analyzers
  }
}

export const useMultiFileAuthState = cjs.useMultiFileAuthState
export const useSingleFileAuthState = cjs.useSingleFileAuthState
export const useSQLiteAuthState = cjs.useSQLiteAuthState
export const useMongoAuthState = cjs.useMongoAuthState
export const createMultiAuthManager = cjs.createMultiAuthManager
export const createSessionPool = cjs.createSessionPool
export const makeInMemoryStore = cjs.makeInMemoryStore
export const makeCacheableSignalKeyStore = cjs.makeCacheableSignalKeyStore
export const DisconnectReason = cjs.DisconnectReason
export const Browsers = cjs.Browsers
export const downloadMediaMessage = cjs.downloadMediaMessage
export const downloadContentFromMessage = cjs.downloadContentFromMessage
export const generateWAMessageFromContent = cjs.generateWAMessageFromContent
export const generateWAMessage = cjs.generateWAMessage
export const generateWAMessageContent = cjs.generateWAMessageContent
export const getContentType = cjs.getContentType
export const getAggregateVotesInPollMessage = cjs.getAggregateVotesInPollMessage
export const proto = cjs.proto
export const BufferJSON = cjs.BufferJSON
export const initAuthCreds = cjs.initAuthCreds
export const fetchLatestWaWebVersion = cjs.fetchLatestWaWebVersion
export const fetchLatestBaileysVersion = cjs.fetchLatestBaileysVersion
export const withAutoReconnect = cjs.withAutoReconnect
export const loadRustBridge = cjs.loadRustBridge
export const A2UI = cjs.A2UI
export const sendA2UIWidget = cjs.sendA2UIWidget
export const createMessageScheduler = cjs.createMessageScheduler
export const createAntiDelete = cjs.createAntiDelete
export const broadcast = cjs.broadcast
export const jidTools = cjs.jidTools
export const presencePulse = cjs.presencePulse
export const healthSnapshot = cjs.healthSnapshot
export const createCommandRouter = cjs.createCommandRouter
export const createCommandHandler = cjs.createCommandHandler
export const buildVCard = cjs.buildVCard
export const createReactionGuard = cjs.createReactionGuard
export const safeSend = cjs.safeSend
export const exportSession = cjs.exportSession
export const importSession = cjs.importSession
export const withTimeout = cjs.withTimeout
export const AntiBan = cjs.AntiBan
export const wrapSocket = cjs.wrapSocket
export const PRESETS = cjs.PRESETS
export const delay = cjs.delay
export const isJidGroup = cjs.isJidGroup
export const isJidBroadcast = cjs.isJidBroadcast
export const isJidNewsletter = cjs.isJidNewsletter
export const jidNormalizedUser = cjs.jidNormalizedUser
export const getBinaryNodeChild = cjs.getBinaryNodeChild
export const WAMessageStubType = cjs.WAMessageStubType
export const WAProto = cjs.WAProto ?? cjs.proto
export const autoCacheViewOnceMedia = cjs.autoCacheViewOnceMedia
export const getViewOnceContent = cjs.getViewOnceContent
export const decodeE2eRekeyPayload = cjs.decodeE2eRekeyPayload
export const decryptMsmsgBotMessage = cjs.decryptMsmsgBotMessage
export const buildRichMessageContent = cjs.buildRichMessageContent
