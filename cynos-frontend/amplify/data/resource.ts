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
        )
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
