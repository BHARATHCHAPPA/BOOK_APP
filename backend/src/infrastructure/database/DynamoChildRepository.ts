import { DynamoBaseRepository } from './DynamoBaseRepository';
import { IChildProfile, IChildRepository } from '../../domain/interfaces/coreRepositories';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';

export class DynamoChildRepository extends DynamoBaseRepository<IChildProfile> implements IChildRepository {

    protected getPK(id: string): string {
        // We need parentId to construct PK "USER#<parentId>"
        // But generic create() only passes item.
        // We can extract it from item in create().
        // For findById(id), we might need GSI if we don't know ParentID.
        throw new Error("Method not implemented in base for composite keys without full item context");
    }

    protected getSK(id: string): string {
        return `CHILD#${id}`;
    }

    // Override create to handle composite key pattern: PK=USER#<parentId>, SK=CHILD#<childId>
    async create(child: IChildProfile): Promise<IChildProfile> {
        const params = {
            TableName: this.tableName,
            Item: {
                PK: `USER#${child.parentId}`,
                SK: `CHILD#${child.id}`,
                GSI1PK: `CHILD#${child.id}`, // Lookup independent of parent
                GSI1SK: `USER#${child.parentId}`,
                Entity: 'ChildProfile',
                ...child
            }
        };
        await this.client.send(new PutCommand(params));
        return child;
    }

    async findByParentId(parentId: string): Promise<IChildProfile[]> {
        const params = {
            TableName: this.tableName,
            KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
            ExpressionAttributeValues: {
                ':pk': `USER#${parentId}`,
                ':sk': 'CHILD#'
            }
        };
        const result = await this.client.send(new QueryCommand(params));
        return result.Items as IChildProfile[];
    }

    async findById(childId: string): Promise<IChildProfile | null> {
        // Use GSI because primary table requires known ParentID (Partition Key)
        const params = {
            TableName: this.tableName,
            IndexName: 'GSI1',
            KeyConditionExpression: 'GSI1PK = :pk',
            ExpressionAttributeValues: {
                ':pk': `CHILD#${childId}`
            }
        };
        const result = await this.client.send(new QueryCommand(params));
        return result.Items?.[0] as IChildProfile || null;
    }

    async softDelete(childId: string): Promise<void> {
        const child = await this.findById(childId);
        if (!child) return;

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
    }
}

import { PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
