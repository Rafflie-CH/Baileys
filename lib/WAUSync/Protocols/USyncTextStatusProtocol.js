"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
const { assertNodeErrorFree } = require("../../WABinary")

class USyncTextStatusProtocol {
    constructor() {
        this.name = 'status'
    }
    getQueryElement() {
        return { tag: 'status', attrs: {} }
    }
    getUserElement() {
        return { tag: 'status', attrs: {} }
    }
    parser(node) {
        if (node.tag !== 'status') return null
        assertNodeErrorFree(node)
        return {
            status: typeof node.content === 'string' ? node.content : (node.content?.toString?.() || null),
            t: node.attrs?.t ? +node.attrs.t : null
        }
    }
}
module.exports = { USyncTextStatusProtocol }
