import { DynamoDBDocumentClient, PutCommand, GetCommand, DeleteCommand, QueryCommand, QueryCommandInput } from '@aws-sdk/lib-dynamodb';
import { docClient } from './dynamoClient';
import { config } from '../../config/env';
import { IBaseEntity } from '../../domain/interfaces/coreRepositories';
import { logger } from '../../shared/logger';

export abstract class DynamoBaseRepository<T extends IBaseEntity> {
    protected readonly tableName = config.DYNAMODB_TABLE_NAME;

    constructor(protected client: DynamoDBDocumentClient = docClient) { }

    protected abstract getPK(id: string): string;
    protected abstract getSK(id: string): string;

    /**
     * Generic Create/Overwrite
     */
    async create(item: T): Promise<T> {
        const params = {
            TableName: this.tableName,
            Item: {
                PK: this.getPK(item.id),
                SK: this.getSK(item.id),
                ...item
            }
        };

        try {
            await this.client.send(new PutCommand(params));
            return item;
        } catch (error) {
            logger.error({ error, item }, 'DynamoDB Create Failed');
            throw error;
        }
    }

    /**
     * Generic Find By ID
     */
    async findById(id: string): Promise<T | null> {
        const params = {
            TableName: this.tableName,
            Key: {
                PK: this.getPK(id),
                SK: this.getSK(id)
            }
        };

        try {
            const result = await this.client.send(new GetCommand(params));
            return result.Item as T || null;
        } catch (error) {
            logger.error({ error, id }, 'DynamoDB FindById Failed');
            throw error;
        }
    }

    /**
     * Soft Delete (Sets isActive: false)
     * Requires T to have isActive boolean, or we just update any attribute.
     * Assuming standard pattern.
     */
    async softDelete(id: string): Promise<void> {
        // This assumes the entity has an 'isActive' field and standard update pattern
        // A real implementation might be more specific or allow passing UpdateExpression
        // details.

        // For now, let's keep it abstract or specific in subclasses. 
        // This is just a placeholder to show structure.
    }
}
