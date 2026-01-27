import { GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from './dynamoClient';
import { config } from '../../config/env';
import { IUser, IUserRepository } from '../../domain/interfaces/userRepository';
import { logger } from '../../shared/logger';

// In-Memory storage for development
const MOCK_USERS: Record<string, IUser> = {};

export class DynamoUserRepository implements IUserRepository {
    private readonly tableName = config.DYNAMODB_TABLE_NAME;

    async findByCognitoSub(sub: string): Promise<IUser | null> {
        return null;
    }

    async findById(id: string): Promise<IUser | null> {
        // 1. Check Mock
        if (MOCK_USERS[id]) return MOCK_USERS[id];

        const params = {
            TableName: this.tableName,
            Key: { PK: `USER#${id}`, SK: `METADATA` }
        };

        try {
            const result = await docClient.send(new GetCommand(params));
            return result.Item as IUser || null;
        } catch (error) {
            // Suppress error for dev environment without creds
            // Return null so the service can create a new (mock) user
            return null;
        }
    }

    async create(user: IUser): Promise<IUser> {
        // 1. Save to Mock
        MOCK_USERS[user.id] = user;

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
        } catch (error) {
            logger.error({ err: error }, 'Detailed DynamoDB Error');
            logger.warn('DynamoDB create user failed, using mock');
        }
        return user;
    }

    async updateCredits(userId: string, amountToAdd: number): Promise<IUser> {
        // 1. Update Mock
        if (MOCK_USERS[userId]) {
            MOCK_USERS[userId].credits = (MOCK_USERS[userId].credits || 0) + amountToAdd;
            MOCK_USERS[userId].updatedAt = new Date().toISOString();
        }

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
            // Fallback to mock if it exists
            if (MOCK_USERS[userId]) return MOCK_USERS[userId];
            throw error;
        }
    }
    async getPurchasedBooks(userId: string): Promise<string[]> {
        if (MOCK_USERS[userId] && (MOCK_USERS[userId] as any).purchasedBooks) {
            return (MOCK_USERS[userId] as any).purchasedBooks;
        }
        return [];
    }

    async addPurchasedBook(userId: string, bookId: string): Promise<void> {
        if (MOCK_USERS[userId]) {
            const user = MOCK_USERS[userId] as any;
            if (!user.purchasedBooks) user.purchasedBooks = [];
            if (!user.purchasedBooks.includes(bookId)) {
                user.purchasedBooks.push(bookId);
            }
        }
        // TODO: Implement DynamoDB persist logic for purchases
    }
}
