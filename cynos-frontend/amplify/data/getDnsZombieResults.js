import * as ddb from "@aws-appsync/utils/dynamodb";

export function request(ctx) {
  return { operation: 'Scan' }
}

export function response(ctx) {
  return ctx.result.items;
}

