import { GetCommand, PutCommand, ScanCommand, QueryCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from './dynamoClient';
import { config } from '../../config/env';
import { IBook, IPurchase } from '../../domain/models';
import { v4 as uuidv4 } from 'uuid';

export class DynamoBookRepository {
    private readonly tableName = config.DYNAMODB_TABLE_NAME;

    async findById(bookId: string): Promise<IBook | null> {
        const params = {
            TableName: this.tableName,
            Key: { PK: `BOOK#${bookId}`, SK: `METADATA` }
        };

        try {
            const result = await docClient.send(new GetCommand(params));
            return result.Item as IBook || null;
        } catch (error) {
            console.error('Error finding book:', error);
            throw error;
        }
    }

    async findAll(limit: number = 50, lastKey?: any): Promise<{ books: IBook[], lastKey?: any }> {
        const params: any = {
            TableName: this.tableName,
            FilterExpression: 'Entity = :entity',
            ExpressionAttributeValues: {
                ':entity': 'Book'
            },
            Limit: limit
        };

        if (lastKey) {
            params.ExclusiveStartKey = lastKey;
        }

        try {
            const result = await docClient.send(new ScanCommand(params));
            return {
                books: (result.Items || []) as IBook[],
                lastKey: result.LastEvaluatedKey
            };
        } catch (error) {
            console.error('Error finding books:', error);
            throw error;
        }
    }

    async findByGenre(genre: string, limit: number = 50): Promise<IBook[]> {
        const params = {
            TableName: this.tableName,
            FilterExpression: 'Entity = :entity AND contains(genre, :genre)',
            ExpressionAttributeValues: {
                ':entity': 'Book',
                ':genre': genre
            },
            Limit: limit
        };

        try {
            const result = await docClient.send(new ScanCommand(params));
            return (result.Items || []) as IBook[];
        } catch (error) {
            console.error('Error finding books by genre:', error);
            throw error;
        }
    }

    async create(bookData: Omit<IBook, 'id' | 'createdAt' | 'updatedAt'>): Promise<IBook> {
        const book: IBook = {
            id: uuidv4(),
            ...bookData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const params = {
            TableName: this.tableName,
            Item: {
                PK: `BOOK#${book.id}`,
                SK: `METADATA`,
                Entity: 'Book',
                ...book
            },
            ConditionExpression: 'attribute_not_exists(PK)'
        };

        try {
            await docClient.send(new PutCommand(params));
            return book;
        } catch (error) {
            console.error('Error creating book:', error);
            throw error;
        }
    }

    async update(bookId: string, updates: Partial<Omit<IBook, 'id' | 'createdAt'>>): Promise<IBook> {
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
            Key: { PK: `BOOK#${bookId}`, SK: `METADATA` },
            UpdateExpression: `SET ${updateExpressions.join(', ')}`,
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues,
            ReturnValues: 'ALL_NEW' as const
        };

        try {
            const result = await docClient.send(new UpdateCommand(params));
            return result.Attributes as IBook;
        } catch (error) {
            console.error('Error updating book:', error);
            throw error;
        }
    }

    async delete(bookId: string): Promise<void> {
        const params = {
            TableName: this.tableName,
            Key: { PK: `BOOK#${bookId}`, SK: `METADATA` }
        };

        try {
            await docClient.send(new DeleteCommand(params));
        } catch (error) {
            console.error('Error deleting book:', error);
            throw error;
        }
    }

    // Purchase operations
    async createPurchase(userId: string, bookId: string, creditsSpent: number, childId?: string): Promise<IPurchase> {
        const purchase: IPurchase = {
            id: uuidv4(),
            userId,
            bookId,
            childId,
            purchaseDate: new Date().toISOString(),
            creditsSpent,
            status: 'completed'
        };

        const params = {
            TableName: this.tableName,
            Item: {
                PK: `USER#${userId}`,
                SK: `PURCHASE#${purchase.id}`,
                GSI1PK: `BOOK#${bookId}`,
                GSI1SK: `PURCHASE#${purchase.id}`,
                Entity: 'Purchase',
                ...purchase
            }
        };

        try {
            await docClient.send(new PutCommand(params));
            return purchase;
        } catch (error) {
            console.error('Error creating purchase:', error);
            throw error;
        }
    }

    async findPurchasesByUser(userId: string): Promise<IPurchase[]> {
        const params = {
            TableName: this.tableName,
            KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
            ExpressionAttributeValues: {
                ':pk': `USER#${userId}`,
                ':sk': 'PURCHASE#'
            }
        };

        try {
            const result = await docClient.send(new QueryCommand(params));
            return (result.Items || []) as IPurchase[];
        } catch (error) {
            console.error('Error finding purchases:', error);
            throw error;
        }
    }

    async hasPurchased(userId: string, bookId: string): Promise<boolean> {
        const purchases = await this.findPurchasesByUser(userId);
        return purchases.some(p => p.bookId === bookId && p.status === 'completed');
    }
}
