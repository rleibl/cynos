import * as ddb from "@aws-appsync/utils/dynamodb";

export function request(ctx) {

  console.log("Request to getDomainscanResults with lastEvaluatedKey:", ctx.args.lastEvaluatedKey);

  return ddb.scan({ 
    limit: ctx.args.limit || 30,
    nextToken: ctx.args.lastEvaluatedKey || null
  });
}

export function response(ctx) {

  console.log("Response from getDomainscanResults:", ctx.result);

  return { 
    items: ctx.result.items,
    lastEvaluatedKey: ctx.result.nextToken
  };
}

