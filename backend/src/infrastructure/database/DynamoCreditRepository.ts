import { PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from './dynamoClient';
import { config } from '../../config/env';
import { ICreditTransaction } from '../../domain/models';
import { v4 as uuidv4 } from 'uuid';

export class DynamoCreditRepository {
    private readonly tableName = config.DYNAMODB_TABLE_NAME;

    async addCredits(userId: string, amount: number, type: 'purchase' | 'bonus', description: string): Promise<ICreditTransaction> {
        const transaction: ICreditTransaction = {
            id: uuidv4(),
            userId,
            amount,
            type,
            description,
            createdAt: new Date().toISOString()
        };

        // Create transaction record
        const transactionParams = {
            TableName: this.tableName,
            Item: {
                PK: `USER#${userId}`,
                SK: `TRANSACTION#${transaction.createdAt}#${transaction.id}`,
                Entity: 'CreditTransaction',
                ...transaction
            }
        };

        // Update user credits
        const userParams = {
            TableName: this.tableName,
            Key: { PK: `USER#${userId}`, SK: `METADATA` },
            UpdateExpression: 'SET credits = if_not_exists(credits, :start) + :amount, updatedAt = :now',
            ExpressionAttributeValues: {
                ':amount': amount,
                ':start': 0,
                ':now': new Date().toISOString()
            }
        };

        try {
            await docClient.send(new PutCommand(transactionParams));
            await docClient.send(new UpdateCommand(userParams));
            return transaction;
        } catch (error) {
            console.error('Error adding credits:', error);
            throw error;
        }
    }

    async spendCredits(userId: string, amount: number, description: string, relatedEntityId?: string): Promise<ICreditTransaction> {
        const transaction: ICreditTransaction = {
            id: uuidv4(),
            userId,
            amount: -amount, // Negative for spending
            type: 'spend',
            description,
            relatedEntityId,
            createdAt: new Date().toISOString()
        };

        // Create transaction record
        const transactionParams = {
            TableName: this.tableName,
            Item: {
                PK: `USER#${userId}`,
                SK: `TRANSACTION#${transaction.createdAt}#${transaction.id}`,
                Entity: 'CreditTransaction',
                ...transaction
            }
        };

        // Update user credits (with check for sufficient balance)
        const userParams = {
            TableName: this.tableName,
            Key: { PK: `USER#${userId}`, SK: `METADATA` },
            UpdateExpression: 'SET credits = credits - :amount, updatedAt = :now',
            ConditionExpression: 'credits >= :amount',
            ExpressionAttributeValues: {
                ':amount': amount,
                ':now': new Date().toISOString()
            }
        };

        try {
            await docClient.send(new PutCommand(transactionParams));
            await docClient.send(new UpdateCommand(userParams));
            return transaction;
        } catch (error: any) {
            if (error.name === 'ConditionalCheckFailedException') {
                throw new Error('Insufficient credits');
            }
            console.error('Error spending credits:', error);
            throw error;
        }
    }

    async getTransactionHistory(userId: string, limit: number = 50): Promise<ICreditTransaction[]> {
        const params = {
            TableName: this.tableName,
            KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
            ExpressionAttributeValues: {
                ':pk': `USER#${userId}`,
                ':sk': 'TRANSACTION#'
            },
            ScanIndexForward: false, // Most recent first
            Limit: limit
        };

        try {
            const result = await docClient.send(new QueryCommand(params));
            return (result.Items || []) as ICreditTransaction[];
        } catch (error) {
            console.error('Error getting transaction history:', error);
            throw error;
        }
    }

    async refundCredits(userId: string, amount: number, originalTransactionId: string): Promise<ICreditTransaction> {
        const transaction: ICreditTransaction = {
            id: uuidv4(),
            userId,
            amount,
            type: 'refund',
            description: `Refund for transaction ${originalTransactionId}`,
            relatedEntityId: originalTransactionId,
            createdAt: new Date().toISOString()
        };

        const transactionParams = {
            TableName: this.tableName,
            Item: {
                PK: `USER#${userId}`,
                SK: `TRANSACTION#${transaction.createdAt}#${transaction.id}`,
                Entity: 'CreditTransaction',
                ...transaction
            }
        };

        const userParams = {
            TableName: this.tableName,
            Key: { PK: `USER#${userId}`, SK: `METADATA` },
            UpdateExpression: 'SET credits = credits + :amount, updatedAt = :now',
            ExpressionAttributeValues: {
                ':amount': amount,
                ':now': new Date().toISOString()
            }
        };

        try {
            await docClient.send(new PutCommand(transactionParams));
            await docClient.send(new UpdateCommand(userParams));
            return transaction;
        } catch (error) {
            console.error('Error refunding credits:', error);
            throw error;
        }
    }
}
