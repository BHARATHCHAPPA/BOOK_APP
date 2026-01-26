import { GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from './dynamoClient';
import { config } from '../../config/env';
import { IUser, IUserRepository } from '../../domain/interfaces/userRepository';
import { logger } from '../../shared/logger';

export class DynamoUserRepository implements IUserRepository {
    private readonly tableName = config.DYNAMODB_TABLE_NAME;

    async findByCognitoSub(sub: string): Promise<IUser | null> {
        // Production Note: Ideally use a GSI (Global Secondary Index) here if 'sub' is different from 'id'.
        // Current design assumes ID lookup is primary.
        return null;
    }

    async findById(id: string): Promise<IUser | null> {
        const params = {
            TableName: this.tableName,
            Key: { PK: `USER#${id}`, SK: `METADATA` }
        };

        try {
            const result = await docClient.send(new GetCommand(params));
            return result.Item as IUser || null;
        } catch (error) {
            logger.error({ error, id }, 'DynamoDB findById failed');
            throw error; // Propagate error in production so alerts trigger
        }
    }

    async create(user: IUser): Promise<IUser> {
        const params = {
            TableName: this.tableName,
            Item: {
                PK: `USER#${user.id}`,
                SK: `METADATA`,
                GSI1PK: `SUB#${user.cognitoSub}`,
                GSI1SK: `METADATA`,
                Entity: 'User',
                ...user
            },
            ConditionExpression: 'attribute_not_exists(PK)'
        };

        try {
            await docClient.send(new PutCommand(params));
            return user;
        } catch (error) {
            logger.error({ error, userId: user.id }, 'DynamoDB create user failed');
            throw error;
        }
    }

    async updateCredits(userId: string, amountToAdd: number): Promise<IUser> {
        const params = {
            TableName: this.tableName,
            Key: { PK: `USER#${userId}`, SK: `METADATA` },
            UpdateExpression: 'SET credits = if_not_exists(credits, :start) + :val, updatedAt = :now',
            ExpressionAttributeValues: {
                ':val': amountToAdd,
                ':start': 0,
                ':now': new Date().toISOString()
            },
            ReturnValues: 'ALL_NEW' as const
        };

        try {
            const result = await docClient.send(new UpdateCommand(params));
            return result.Attributes as IUser;
        } catch (error) {
            logger.error({ error, userId }, 'Failed to update credits');
            throw error;
        }
    }
}
