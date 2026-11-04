"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
const { assertNodeErrorFree, getBinaryNodeChild } = require("../../WABinary")

class USyncBusinessProtocol {
    constructor(profileVersion) {
        this.name = 'business'
        this.profileVersion = profileVersion
    }
    getQueryElement() {
        const attrs = {}
        if (this.profileVersion != null) attrs.v = String(this.profileVersion)
        return { tag: 'business', attrs }
    }
    getUserElement() {
        return { tag: 'business', attrs: {} }
    }
    parser(node) {
        if (node.tag !== 'business') return null
        assertNodeErrorFree(node)
        const profile = getBinaryNodeChild(node, 'profile')
        return {
            verifiedName: node.attrs?.verified_name || profile?.attrs?.name || null,
            isBusiness: true,
            tag: node.attrs?.tag || null,
            profile: profile ? { attrs: profile.attrs, content: profile.content } : null
        }
    }
}
module.exports = { USyncBusinessProtocol }
