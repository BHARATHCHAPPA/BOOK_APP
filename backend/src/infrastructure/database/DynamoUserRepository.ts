import { GetCommand, PutCommand, UpdateCommand, ScanCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
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
            return null;
        }
    }

    async findAll(): Promise<IUser[]> {
        // 1. Return Mock Users
        const mockList = Object.values(MOCK_USERS);

        // 2. Scan DynamoDB (Admin MVP only)
        const params = {
            TableName: this.tableName,
            FilterExpression: 'Entity = :entity',
            ExpressionAttributeValues: {
                ':entity': 'User'
            }
        };

        try {
            const result = await docClient.send(new ScanCommand(params));
            const dbList = result.Items as IUser[];

            const map = new Map<string, IUser>();
            mockList.forEach(u => map.set(u.id, u));
            dbList?.forEach(u => map.set(u.id, u));

            return Array.from(map.values());
        } catch (e) {
            return mockList;
        }
    }

    async updateRole(userId: string, newRole: string): Promise<void> {
        // Mock
        if (MOCK_USERS[userId]) {
            MOCK_USERS[userId].role = newRole;
        }

        const params = {
            TableName: this.tableName,
            Key: { PK: `USER#${userId}`, SK: `METADATA` },
            UpdateExpression: 'SET #r = :role, updatedAt = :now',
            ExpressionAttributeNames: { '#r': 'role' },
            ExpressionAttributeValues: {
                ':role': newRole,
                ':now': new Date().toISOString()
            }
        };

        try {
            await docClient.send(new UpdateCommand(params));
        } catch (e) {
            logger.error({ err: e }, 'DynamoDB role update failed');
        }
    }

    async updateStatus(userId: string, status: string): Promise<void> {
        // Mock
        if (MOCK_USERS[userId]) {
            (MOCK_USERS[userId] as any).status = status;
        }

        const params = {
            TableName: this.tableName,
            Key: { PK: `USER#${userId}`, SK: `METADATA` },
            UpdateExpression: 'SET #s = :status, updatedAt = :now',
            ExpressionAttributeNames: { '#s': 'status' },
            ExpressionAttributeValues: {
                ':status': status,
                ':now': new Date().toISOString()
            }
        };

        try {
            await docClient.send(new UpdateCommand(params));
        } catch (e) {
            logger.error({ err: e }, 'DynamoDB status update failed');
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
    }

    async delete(userId: string): Promise<void> {
        // Mock
        if (MOCK_USERS[userId]) {
            delete MOCK_USERS[userId];
        }

        const params = {
            TableName: this.tableName,
            Key: { PK: `USER#${userId}`, SK: `METADATA` }
        };

        try {
            await docClient.send(new DeleteCommand(params));
        } catch (e) {
            logger.error({ err: e }, 'DynamoDB user delete failed');
        }
    }
}
