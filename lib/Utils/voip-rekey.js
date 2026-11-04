"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
exports.decodeE2eRekeyPayload = void 0
exports.VOIP_REKEY_AVAILABLE = false

/**
 * VoIP rekey — schema E2eRekeyPayload / RekeyKeyType not present in current WAProto.
 * Returns null; set RAFZ_VOIP_STRICT=1 to throw instead.
 */
function decodeE2eRekeyPayload(_buf) {
    if (process.env.RAFZ_VOIP_STRICT === "1") {
        throw new Error("E2eRekeyPayload schema not available in this WAProto build")
    }
    return null
}
exports.decodeE2eRekeyPayload = decodeE2eRekeyPayload

try {
    const root = require("../../WAProto")
    const proto = root.proto || root
    if (proto.RekeyKeyType || proto.E2eRekeyPayload) {
        exports.VOIP_REKEY_AVAILABLE = true
    }
} catch (_) {}
