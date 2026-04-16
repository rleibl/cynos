import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { aws_dynamodb } from "aws-cdk-lib";

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
export const backend = defineBackend({
  auth,
  data,
});

const externalDataSourcesStack = backend.createStack("ExternalDataSources");

const externalTable = aws_dynamodb.Table.fromTableName(
	externalDataSourcesStack,
	"ExternalDataTable",
	"CynosSettings"
);

backend.data.addDynamoDbDataSource(
	"ExternalTableDataSource",
	externalTable
);


/*
const externalDataSourcesStack = backend.createStack("MyExternalDataSources");


const externalTable = aws_dynamodb.Table.fromTableName(
  externalDataSourcesStack,
  "MyExternalPostTable",
  "PostTable"
);


backend.data.addDynamoDbDataSource(
  "ExternalPostTableDataSource",
  externalTable
);
*/
