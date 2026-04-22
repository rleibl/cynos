import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({

  Todo: a
    .model({
      content: a.string(),
    })
    .authorization(allow => [allow.guest()]),

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
	  share: a.string(),
	  user: a.string(),
	  privileges: a.string(),
  }),

  SMBHost: a.customType({
     ip: a.string(),            // 10.12.212.22
     hostname: a.string(),      // "myfiles.grp.haufemg.com"
     last_seen: a.string(),     // "01-01-2024"
     comment: a.string(),       // ""
     known_host: a.boolean(),   // false
     cyber_comment: a.string(), // ""
     shares: a.ref("SMBShare").array() 
   }),

   SMBHostContainer: a.customType({
	   hosts: a.json()
   }),

   getSMBHosts: a
       .query()
       .arguments({})
       .returns(a.ref("SMBHost").array())
       .authorization(allow => [allow.publicApiKey()])
       .handler(
         a.handler.custom({
	    dataSource: "ExternalSMBTableSource",
	    entry: "./getSMBHosts.js"
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
