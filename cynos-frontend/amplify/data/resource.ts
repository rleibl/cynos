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
