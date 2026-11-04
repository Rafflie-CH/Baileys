"use strict"
Object.defineProperty(exports, "__esModule", { value: true })

class USyncSidelistProtocol {
    constructor(useLidAddressing = false) {
        this.name = 'sidelist'
        this.useLidAddressing = !!useLidAddressing
    }
    getQueryElement() {
        return {
            tag: 'side_list',
            attrs: this.useLidAddressing ? { addressing_mode: 'lid' } : {}
        }
    }
    getUserElement() {
        return { tag: 'side_list', attrs: {} }
    }
    parser(node) {
        return node || null
    }
}
module.exports = { USyncSidelistProtocol }
