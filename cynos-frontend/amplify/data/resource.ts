import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({

    Rss: a.customType({
        key: a.string(),
        t: a.integer(),
    }),

    getRss: a
        .query()
        .arguments({})
        .returns(a.ref("Rss"))
        .authorization(allow => [allow.publicApiKey()])
        .handler(
            a.handler.custom({
                dataSource: "ExternalTableDataSource",
                entry: "./getRss.js",
            })
        ),

    SMBShare: a.customType({
        hostname: a.string(),      // "myfiles.grp.haufemg.com"
        share_name: a.string(),    // "Public$"
        ip: a.string(),            // 10.12.212.22
        user: a.string(),
        privileges: a.string(),
        last_seen: a.string(),     // "01-01-2024"
        first_seen: a.string(),    // "01-01-2024"
        comment: a.string(),       // ""
        cyber_status: a.string(),   // false
        cyber_comment: a.string(), // ""
    }),

    getSMBShares: a
        .query()
        .arguments({})
        .returns(a.ref("SMBShare").array())
        .authorization(allow => [allow.publicApiKey()])
        .handler(
            a.handler.custom({
                dataSource: "ExternalSMBTableSource",
                entry: "./getSMBShares.js"
            })
        ),

    setSMBShare: a
        .mutation()
        .arguments({
            hostname: a.string(),
            share_name: a.string(),
            cyber_status: a.string(),
            cyber_comment: a.string(),
        })
        .returns(a.ref("SMBShare"))
        .authorization(allow => [allow.publicApiKey()])
        .handler(
            a.handler.custom({
                dataSource: "ExternalSMBTableSource",
                entry: "./setSMBShare.js"
            })
        ),

    SMBLogEntry: a.customType({
        timestamp: a.string(),
        message: a.string(),
    }),

    getSMBLog: a
        .query()
        .arguments({})
        .returns(a.ref("SMBLogEntry").array())
        .authorization(allow => [allow.publicApiKey()])
        .handler(
            a.handler.custom({
                dataSource: "ExternalSMBLogTableSource",
                entry: "./getSMBLog.js"
            })
        ),

    DomainscanResult: a.customType({
        items: a.ref("DomainscanItem").array(),
        lastEvaluatedKey: a.string(),
    }),
    
    DomainscanItem: a.customType({
        domain: a.string(),
        ip: a.string(),
        classification: a.string(),
        organization: a.string(),
        source: a.string(),
        screenshot: a.string(),
        last_seen: a.string(),     // "01-01-2024"
        first_seen: a.string(),    // "01-01-2024"
        cyber_status: a.string(),   // false
        cyber_comment: a.string(), // ""
    }),

    getDomainscanResults: a
        .query()
        .arguments({
            limit: a.integer(),
            lastEvaluatedKey: a.string()
        })
        .returns(a.ref("DomainscanResult"))
        .authorization(allow => [allow.publicApiKey()])
        .handler(
            a.handler.custom({
                dataSource: "ExternalDomainscanResultsTableSource",
                entry: "./getDomainscanResults.js"
            })
        ),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
    schema,
    authorizationModes: {
        defaultAuthorizationMode: 'apiKey',
        apiKeyAuthorizationMode: {
            expiresInDays: 30,
        },
    },
});
