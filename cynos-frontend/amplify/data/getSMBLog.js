import * as ddb from "@aws-appsync/utils/dynamodb";

export function request(ctx) {
  return {
    operation: "Scan",
    limit: 30,
  };
}

export function response(ctx) {
  return ctx.result.items;
}