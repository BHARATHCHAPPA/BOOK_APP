import { CreateTableCommand, DynamoDBClient, ResourceInUseException, KeyType, ScalarAttributeType, BillingMode, ProjectionType } from '@aws-sdk/client-dynamodb';
import * as dotenv from 'dotenv';
dotenv.config();

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });

const createTable = async () => {
    const tableName = process.env.DYNAMODB_TABLE_NAME || 'ProAuthTable';

    console.log(`Creating table: ${tableName}...`);

    try {
        const data = await client.send(new CreateTableCommand({
            TableName: tableName,
            AttributeDefinitions: [
                { AttributeName: 'PK', AttributeType: ScalarAttributeType.S },
                { AttributeName: 'SK', AttributeType: ScalarAttributeType.S },
                { AttributeName: 'GSI1PK', AttributeType: ScalarAttributeType.S },
                { AttributeName: 'GSI1SK', AttributeType: ScalarAttributeType.S }
            ],
            KeySchema: [
                { AttributeName: 'PK', KeyType: KeyType.HASH },
                { AttributeName: 'SK', KeyType: KeyType.RANGE }
            ],
            GlobalSecondaryIndexes: [
                {
                    IndexName: 'GSI1',
                    KeySchema: [
                        { AttributeName: 'GSI1PK', KeyType: KeyType.HASH },
                        { AttributeName: 'GSI1SK', KeyType: KeyType.RANGE }
                    ],
                    Projection: {
                        ProjectionType: ProjectionType.ALL
                    }
                }
            ],
            BillingMode: BillingMode.PAY_PER_REQUEST
        }));
        console.log('✅ Table Created Successfully:', data.TableDescription?.TableArn);
    } catch (err: any) {
        if (err instanceof ResourceInUseException || err.name === 'ResourceInUseException') {
            console.log('⚠️ Table already exists.');
        } else {
            console.error('❌ Error creating table:', err);
            process.exit(1);
        }
    }
};

createTable();
