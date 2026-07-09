import { util } from "@aws-appsync/utils";
import * as ddb from "@aws-appsync/utils/dynamodb";

// This is an example of a request function and is currently unused
/*
function example_request(ctx) {
    const { hostname, share_name, cyber_status, cyber_comment } = ctx.args;

    return ddb.update({
        key: {
            hostname: hostname,
            share_name: share_name
        },
        update: {
            cyber_status: cyber_status,
            cyber_comment: cyber_comment
        },
        // condition: { } // condition may not be empty
    });
}
*/

export function request(ctx) {
    const { name, ...values } = ctx.args;

    return ddb.update({
        key: {
            name: name,
        },
        update: {
            ...values
        }
    });
}

export function response(ctx) {
  const { error, result } = ctx;
  if (error) {
    util.appendError(error.message, error.type);
  }
  return result;
}