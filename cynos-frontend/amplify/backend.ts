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

// Settings
const externalTable = aws_dynamodb.Table.fromTableName(
	externalDataSourcesStack,
	"ExternalDataTable",
	"CynosSettings"
);

backend.data.addDynamoDbDataSource(
	"ExternalTableDataSource",
	externalTable
);

// SMB
const externalSMBTable = aws_dynamodb.Table.fromTableName(
	externalDataSourcesStack,
	"ExternalSMBTable",
	"CynosSMBShares"
);

backend.data.addDynamoDbDataSource(
	"ExternalSMBTableSource",
	externalSMBTable
);

const externalSMBLogTable = aws_dynamodb.Table.fromTableName(
	externalDataSourcesStack,
	"ExternalSMBLogTable",
	"CynosSMBLog"
);

backend.data.addDynamoDbDataSource(
	"ExternalSMBLogTableSource",
	externalSMBLogTable
);

// Domain Scan
const externalDomainscanResults = aws_dynamodb.Table.fromTableName(
	externalDataSourcesStack,
	"ExternalDomainscanResultsTable",
	"CynosDomainScan"
);

backend.data.addDynamoDbDataSource(
	"ExternalDomainscanResultsTableSource",
	externalDomainscanResults
);

// DNS Zombie
const externalDnsZombieResults = aws_dynamodb.Table.fromTableName(
	externalDataSourcesStack,
	"ExternalDnsZombieResultsTable",
	"CynosDNZombie"
);

backend.data.addDynamoDbDataSource(
	"ExternalDnsZombieResultsTableSource",
	externalDnsZombieResults
);