"use strict"

Object.defineProperty(exports, "__esModule", { value: true })

const { DEFAULT_CONNECTION_CONFIG } = require("../Defaults/connection")
const { makeCommunitiesSocket } = require("./community")
const { fetchLatestWaWebVersion } = require("../Utils/generics")

/**
 * makeWASocket — Rafz full merge
 * - Auto latest WA Web version
 * - Full interactive / album / newsletter / business / call
 * - Convenience helpers attached in messages-send layer
 * - No auto-follow channel
 */
const makeWASocket = (config = {}) => {
	const newConfig = {
		...DEFAULT_CONNECTION_CONFIG,
		...config
	}

	if (config.shouldSyncHistoryMessage === undefined) {
		newConfig.shouldSyncHistoryMessage = () => !!newConfig.syncFullHistory
	}

	if (!config.version) {
		// fire-and-patch; first handshake uses cached, subsequent uses latest
		fetchLatestWaWebVersion()
			.then(({ version, isLatest }) => {
				if (isLatest && Array.isArray(version) && version.length === 3) {
					newConfig.version = version
					DEFAULT_CONNECTION_CONFIG.version = version
					try {
						const fs = require("fs")
						const path = require("path")
						const vp = path.join(__dirname, "../Defaults/baileys-version.json")
						fs.writeFileSync(vp, JSON.stringify({ version }, null, 2))
					} catch (_) {}
				}
			})
			.catch(() => {})
	}

	return makeCommunitiesSocket(newConfig)
}

exports.default = makeWASocket
