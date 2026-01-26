import { GetCommand, PutCommand, QueryCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from './dynamoClient';
import { config } from '../../config/env';
import { IChild } from '../../domain/models';
import { v4 as uuidv4 } from 'uuid';

export class DynamoChildRepository {
    private readonly tableName = config.DYNAMODB_TABLE_NAME;

    async findById(childId: string): Promise<IChild | null> {
        const params = {
            TableName: this.tableName,
            Key: { PK: `CHILD#${childId}`, SK: `METADATA` }
        };

        try {
            const result = await docClient.send(new GetCommand(params));
            return result.Item as IChild || null;
        } catch (error) {
            console.error('Error finding child:', error);
            throw error;
        }
    }

    async findByUserId(userId: string): Promise<IChild[]> {
        const params = {
            TableName: this.tableName,
            IndexName: 'GSI1',
            KeyConditionExpression: 'GSI1PK = :pk AND begins_with(GSI1SK, :sk)',
            ExpressionAttributeValues: {
                ':pk': `USER#${userId}`,
                ':sk': 'CHILD#'
            }
        };

        try {
            const result = await docClient.send(new QueryCommand(params));
            return (result.Items || []) as IChild[];
        } catch (error) {
            console.error('Error finding children by user:', error);
            throw error;
        }
    }

    async create(userId: string, childData: Omit<IChild, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<IChild> {
        const child: IChild = {
            id: uuidv4(),
            userId,
            ...childData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const params = {
            TableName: this.tableName,
            Item: {
                PK: `CHILD#${child.id}`,
                SK: `METADATA`,
                GSI1PK: `USER#${userId}`,
                GSI1SK: `CHILD#${child.id}`,
                Entity: 'Child',
                ...child
            },
            ConditionExpression: 'attribute_not_exists(PK)'
        };

        try {
            await docClient.send(new PutCommand(params));
            return child;
        } catch (error) {
            console.error('Error creating child:', error);
            throw error;
        }
    }

    async update(childId: string, updates: Partial<Omit<IChild, 'id' | 'userId' | 'createdAt'>>): Promise<IChild> {
        const updateExpressions: string[] = [];
        const expressionAttributeNames: Record<string, string> = {};
        const expressionAttributeValues: Record<string, any> = {};

        Object.entries(updates).forEach(([key, value]) => {
            updateExpressions.push(`#${key} = :${key}`);
            expressionAttributeNames[`#${key}`] = key;
            expressionAttributeValues[`:${key}`] = value;
        });

        updateExpressions.push('#updatedAt = :updatedAt');
        expressionAttributeNames['#updatedAt'] = 'updatedAt';
        expressionAttributeValues[':updatedAt'] = new Date().toISOString();

        const params = {
            TableName: this.tableName,
            Key: { PK: `CHILD#${childId}`, SK: `METADATA` },
            UpdateExpression: `SET ${updateExpressions.join(', ')}`,
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues,
            ReturnValues: 'ALL_NEW' as const
        };

        try {
            const result = await docClient.send(new UpdateCommand(params));
            return result.Attributes as IChild;
        } catch (error) {
            console.error('Error updating child:', error);
            throw error;
        }
    }

    async delete(childId: string): Promise<void> {
        const params = {
            TableName: this.tableName,
            Key: { PK: `CHILD#${childId}`, SK: `METADATA` }
        };

        try {
            await docClient.send(new DeleteCommand(params));
        } catch (error) {
            console.error('Error deleting child:', error);
            throw error;
        }
    }
}
