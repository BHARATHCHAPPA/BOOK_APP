import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from './dynamoClient';
import { config } from '../../config/env';
import { IAuditLog, IAuditRepository } from '../../domain/interfaces/repositories';
import { logger } from '../../shared/logger';

export class DynamoAuditRepository implements IAuditRepository {
    private readonly tableName = config.DYNAMODB_TABLE_NAME;

    /**
     * Appends an audit log entry.
     * PK: AUDIT#<transactionId>
     * SK: AUDIT#<timestamp>
     * This structure allows for retrieving specific transactions or time-ranges if GSI added later.
     * For strict ledger, we might just use PK=AUDIT and SK=<timestamp>#<uuid> to order everything globally if volume permits,
     * but partitioning by entity or transaction is usually safer for scale.
     * 
     * Given requirements "Immutable ledgers", we do not provide update/delete methods.
     */
    async appendLog(log: IAuditLog): Promise<void> {
        const pk = `AUDIT#${log.actorId}`; // Partition by Actor to see user history easily? Or generic?
        // Let's go with a Partition by Date or generic Transaction ID if known. 
        // To keep it simple and scalable: each log is its own item.
        // PK: LOG#<YYYY-MM> (for monthly archival) or simply LOG#<ActorID>

        // Let's follow a standard pattern:
        // PK: AUDIT#<ActorID> -> Allows query "what did User X do?"
        // SK: TIMESTAMP#<ISOString>

        const params = {
            TableName: this.tableName,
            Item: {
                PK: `AUDIT#${log.actorId}`,
                SK: `TS#${log.timestamp}`,
                Entity: 'AuditLog',
                ...log,
                // Ensure immutability at app level by not having update methods
            },
        };

        try {
            await docClient.send(new PutCommand(params));
            logger.debug(`Audit log persisted for actor ${log.actorId}`);
        } catch (error) {
            logger.error({ error, log }, 'Failed to persist audit log');
            // In a high-integrity system, failing to audit might mean we should fail the transaction.
            // Depending on strictness, we might throw here.
            throw new Error('Audit Log persistence failed');
        }
    }
}
