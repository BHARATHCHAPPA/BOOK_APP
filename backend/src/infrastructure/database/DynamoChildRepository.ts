import { DynamoBaseRepository } from './DynamoBaseRepository';
import { IChildProfile, IChildRepository } from '../../domain/interfaces/coreRepositories';
import { QueryCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

// In-Memory storage for development
const MOCK_CHILDREN: Record<string, IChildProfile> = {};

export class DynamoChildRepository extends DynamoBaseRepository<IChildProfile> implements IChildRepository {

    protected getPK(id: string): string {
        throw new Error("Method not implemented in base for composite keys without full item context");
    }

    protected getSK(id: string): string {
        return `CHILD#${id}`;
    }

    async create(child: IChildProfile): Promise<IChildProfile> {
        // 1. Mock Storage (always save here for dev)
        MOCK_CHILDREN[child.id] = child;

        const params = {
            TableName: this.tableName,
            Item: {
                PK: `USER#${child.parentId}`,
                SK: `CHILD#${child.id}`,
                GSI1PK: `CHILD#${child.id}`,
                GSI1SK: `USER#${child.parentId}`,
                Entity: 'ChildProfile',
                ...child
            }
        };

        try {
            await this.client.send(new PutCommand(params));
        } catch (error) {
            console.warn('DynamoDB create child failed, using mock');
        }

        return child;
    }

    async findByParentId(parentId: string): Promise<IChildProfile[]> {
        // 1. Try Mock first
        const mockResults = Object.values(MOCK_CHILDREN).filter(c => c.parentId === parentId && c.isActive);
        if (mockResults.length > 0) return mockResults;

        // 2. Try DynamoDB
        const params = {
            TableName: this.tableName,
            KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
            ExpressionAttributeValues: {
                ':pk': `USER#${parentId}`,
                ':sk': 'CHILD#'
            }
        };
        try {
            const result = await this.client.send(new QueryCommand(params));
            return result.Items as IChildProfile[];
        } catch (error) {
            console.warn('DynamoDB findByParentId failed, returning empty list');
            return []; // Return empty list instead of crashing
        }
    }

    async findById(childId: string): Promise<IChildProfile | null> {
        if (MOCK_CHILDREN[childId]) return MOCK_CHILDREN[childId];

        const params = {
            TableName: this.tableName,
            IndexName: 'GSI1',
            KeyConditionExpression: 'GSI1PK = :pk',
            ExpressionAttributeValues: {
                ':pk': `CHILD#${childId}`
            }
        };

        try {
            const result = await this.client.send(new QueryCommand(params));
            return result.Items?.[0] as IChildProfile || null;
        } catch (error) {
            return null;
        }
    }

    async softDelete(childId: string): Promise<void> {
        if (MOCK_CHILDREN[childId]) {
            MOCK_CHILDREN[childId].isActive = false;
        }

        const child = await this.findById(childId);
        if (!child) return;

        try {
            const params = {
                TableName: this.tableName,
                Key: {
                    PK: `USER#${child.parentId}`,
                    SK: `CHILD#${childId}`
                },
                UpdateExpression: 'SET isActive = :false, updatedAt = :now',
                ExpressionAttributeValues: {
                    ':false': false,
                    ':now': new Date().toISOString()
                }
            };
            await this.client.send(new UpdateCommand(params));
        } catch (error) {
            console.warn('DynamoDB delete failed');
        }
    }
}
