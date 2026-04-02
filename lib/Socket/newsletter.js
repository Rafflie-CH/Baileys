"use strict"

Object.defineProperty(exports, "__esModule", { value: true })

const {
  QueryIds, 
  XWAPaths
} = require("../Types")
const { generateProfilePicture, decryptMessageNode, generateMessageID } = require("../Utils")
const { getBinaryNodeChild, getBinaryNodeChildren, getAllBinaryNodeChildren, S_WHATSAPP_NET } = require("../WABinary")
const { makeGroupsSocket } = require("./groups")
const { executeWMexQuery: genericExecuteWMexQuery } = require("./mex") 

const encoder = new TextEncoder()

const parseNewsletterCreateResponse = (response) => {
    const { id, thread_metadata: thread, viewer_metadata: viewer } = response
    return {
        id: id,
        owner: undefined,
        name: thread.name.text,
        creation_time: parseInt(thread.creation_time, 10),
        description: thread.description.text,
        invite: thread.invite,
        subscribers: parseInt(thread.subscribers_count, 10),
        verification: thread.verification,
        picture: {
            id: thread.picture.id,
            directPath: thread.picture.direct_path
        },
        mute_state: viewer.mute
    }
}

const parseNewsletterMetadata = (result) => {
    if (typeof result !== 'object' || result === null) return null
    if ('id' in result && typeof result.id === 'string') return result
    if ('result' in result && typeof result.result === 'object' && result.result !== null && 'id' in result.result) return result.result
    return null
}

const makeNewsletterSocket = (config) => {
    const suki = makeGroupsSocket(config)
    const { 
        query, 
        generateMessageTag,
        authState,
        signalRepository
    } = suki
    
    const executeWMexQuery = (variables, queryId, dataPath) => {
        return genericExecuteWMexQuery(variables, queryId, dataPath, query, generateMessageTag)
    }
    
    const newsletterQuery = async (jid, type, content) => (
        query({
            tag: 'iq',
            attrs: {
                id: generateMessageTag(),
                type,
                xmlns: 'newsletter',
                to: jid,
            },
            content
        })
    )

    const newsletterWMexQueryRaw = async (jid, query_id, content) => (
        query({
            tag: 'iq',
            attrs: {
                id: generateMessageTag(),
                type: 'get',
                xmlns: 'w:mex',
                to: S_WHATSAPP_NET,
            },
            content: [
                {
                    tag: 'query',
                    attrs: { query_id },
                    content: encoder.encode(JSON.stringify({
                        variables: {
                            newsletter_id: jid,
                            ...content
                        }
                    }))
                }
            ]
        })
    )

    const parseFetchedUpdates = async (node, type) => {
        let child
        if (type === 'messages') {
            child = getBinaryNodeChild(node, 'messages')
        } else {
            const parent = getBinaryNodeChild(node, 'message_updates')
            child = getBinaryNodeChild(parent, 'messages')
        }

        return await Promise.all(getAllBinaryNodeChildren(child).map(async (messageNode) => {
            const views = parseInt(getBinaryNodeChild(messageNode, 'views_count')?.attrs?.count || '0')
            const reactionNode = getBinaryNodeChild(messageNode, 'reactions')
            const reactions = getBinaryNodeChildren(reactionNode, 'reaction')
                .map(({ attrs }) => ({ count: +attrs.count, code: attrs.code }))

            const data = {
                server_id: messageNode.attrs.server_id,
                views,
                reactions
            }

            if (type === 'messages') {
                const { fullMessage: message, decrypt } = await decryptMessageNode(
                    messageNode,
                    authState.creds.me.id,
                    authState.creds.me.lid || '',
                    signalRepository,
                    config.logger
                )
                await decrypt()
                data.message = message
            }

            return data
        }))
    }

    const newsletterUpdate = async (jid, updates) => {
        const variables = {
            newsletter_id: jid,
            updates: {
                ...updates,
                settings: null
            }
        }
        return executeWMexQuery(variables, QueryIds.UPDATE_METADATA, XWAPaths.UPDATE)
    }
    
    return {
        ...suki,
        executeWMexQuery,

        newsletterCreate: async (name, description) => {
            const variables = {
                input: {
                    name,
                    description: description ?? null
                }
            }
            const rawResponse = await executeWMexQuery(variables, QueryIds.CREATE, XWAPaths.CREATE)
            return parseNewsletterCreateResponse(rawResponse)
        },

        newsletterUpdate,

        newsletterSubscribers: async (jid) => {
            return executeWMexQuery({ newsletter_id: jid }, QueryIds.SUBSCRIBERS, XWAPaths.SUBSCRIBERS)
        },

        newsletterMetadata: async (type, key) => {
            const variables = {
                fetch_creation_time: true,
                fetch_full_image: true,
                fetch_viewer_metadata: true,
                input: {
                    key,
                    type: type.toUpperCase()
                }
            }
            const result = await executeWMexQuery(variables, QueryIds.METADATA, XWAPaths.METADATA)
            return parseNewsletterMetadata(result)
        },

        newsletterFollow: (jid) => {
            return executeWMexQuery({ newsletter_id: jid }, QueryIds.FOLLOW, XWAPaths.FOLLOW)
        },

        newsletterUnfollow: (jid) => {
            return executeWMexQuery({ newsletter_id: jid }, QueryIds.UNFOLLOW, XWAPaths.UNFOLLOW)
        },

        newsletterMute: (jid) => {
            return executeWMexQuery({ newsletter_id: jid }, QueryIds.MUTE, XWAPaths.MUTE_V2)
        },

        newsletterUnmute: (jid) => {
            return executeWMexQuery({ newsletter_id: jid }, QueryIds.UNMUTE, XWAPaths.UNMUTE_V2)
        },

        newsletterUpdateName: async (jid, name) => {
            return await newsletterUpdate(jid, { name })
        },

        newsletterUpdateDescription: async (jid, description) => {
            return await newsletterUpdate(jid, { description })
        },

        newsletterUpdatePicture: async (jid, content) => {
            const { img } = await generateProfilePicture(content)
            return await newsletterUpdate(jid, { picture: img.toString('base64') })
        },

        newsletterRemovePicture: async (jid) => {
            return await newsletterUpdate(jid, { picture: '' })
        },

        newsletterReactMessage: async (jid, serverId, reaction) => {
            await query({
                tag: 'message',
                attrs: {
                    to: jid,
                    ...(reaction ? {} : { edit: '7' }),
                    type: 'reaction',
                    server_id: serverId,
                    id: generateMessageID()
                },
                content: [
                    {
                        tag: 'reaction',
                        attrs: reaction ? { code: reaction } : {}
                    }
                ]
            })
        },

        newsletterFetchMessages: async (jid, count, since, after) => {
            const messageUpdateAttrs = { count: count.toString() }

            if (typeof since === 'number') messageUpdateAttrs.since = since.toString()
            if (after) messageUpdateAttrs.after = after.toString()

            const result = await newsletterQuery(jid, 'get', [
                {
                    tag: 'message_updates',
                    attrs: messageUpdateAttrs
                }
            ])

            return await parseFetchedUpdates(result, 'updates')
        },

        newsletterFetchMessagesFull: async (jid, count) => {
            const result = await newsletterQuery(jid, 'get', [
                {
                    tag: 'messages',
                    attrs: { count: count.toString() }
                }
            ])

            return await parseFetchedUpdates(result, 'messages')
        },

        subscribeNewsletterUpdates: async (jid) => {
            const result = await newsletterQuery(jid, 'set', [
                { tag: 'live_updates', attrs: {}, content: [] }
            ])

            const liveUpdatesNode = getBinaryNodeChild(result, 'live_updates')
            const duration = liveUpdatesNode?.attrs?.duration

            return duration ? { duration } : null
        },

        newsletterAdminCount: async (jid) => {
            const response = await executeWMexQuery({ newsletter_id: jid }, QueryIds.ADMIN_COUNT, XWAPaths.ADMIN_COUNT)
            return response.admin_count
        },

        newsletterChangeOwner: async (jid, newOwnerJid) => {
            await executeWMexQuery({ newsletter_id: jid, user_id: newOwnerJid }, QueryIds.CHANGE_OWNER, XWAPaths.CHANGE_OWNER)
        },

        newsletterDemote: async (jid, userJid) => {
            await executeWMexQuery({ newsletter_id: jid, user_id: userJid }, QueryIds.DEMOTE, XWAPaths.DEMOTE)
        },

        newsletterDelete: async (jid) => {
            await executeWMexQuery({ newsletter_id: jid }, QueryIds.DELETE, XWAPaths.DELETE_V2)
        }
    }
}

module.exports = {
  makeNewsletterSocket, 
  parseNewsletterMetadata
}
