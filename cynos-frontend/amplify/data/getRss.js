import * as ddb from "@aws-appsync/utils/dynamodb";

export function request(ctx) {
  const r = ddb.get({ key: { key: "rss_last_check" } });
  return r;
}

export function response(ctx) {
  return ctx.result;
}
