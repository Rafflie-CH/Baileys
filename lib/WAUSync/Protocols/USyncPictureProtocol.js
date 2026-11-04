"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
const { assertNodeErrorFree } = require("../../WABinary")

class USyncPictureProtocol {
    constructor(type = 'image') {
        this.name = 'picture'
        this.type = type
    }
    getQueryElement() {
        return { tag: 'picture', attrs: { type: this.type || 'image' } }
    }
    getUserElement() {
        return { tag: 'picture', attrs: {} }
    }
    parser(node) {
        if (node.tag !== 'picture') return null
        assertNodeErrorFree(node)
        return {
            url: node.attrs?.url || null,
            id: node.attrs?.id || null,
            type: node.attrs?.type || this.type,
            directPath: node.attrs?.direct_path || null
        }
    }
}
module.exports = { USyncPictureProtocol }
