"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
const { assertNodeErrorFree, getBinaryNodeChildren } = require("../../WABinary")

class USyncFeatureProtocol {
    constructor(features = []) {
        this.name = 'feature'
        this.features = Array.isArray(features) ? features : []
    }
    getQueryElement() {
        return {
            tag: 'feature',
            attrs: {},
            content: this.features.map(f => ({ tag: 'feature', attrs: { name: String(f) } }))
        }
    }
    getUserElement() {
        return { tag: 'feature', attrs: {} }
    }
    parser(node) {
        if (node.tag !== 'feature') return null
        assertNodeErrorFree(node)
        const children = getBinaryNodeChildren(node, 'feature') || []
        return children.map(c => c.attrs?.name).filter(Boolean)
    }
}
module.exports = { USyncFeatureProtocol }
