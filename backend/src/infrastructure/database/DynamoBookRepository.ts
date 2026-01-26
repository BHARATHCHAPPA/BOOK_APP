import { DynamoBaseRepository } from './DynamoBaseRepository';
import { IBookVersion, IBookRepository } from '../../domain/interfaces/coreRepositories';
import { PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

export class DynamoBookRepository extends DynamoBaseRepository<IBookVersion> implements IBookRepository {

    protected getPK(id: string): string {
        // Requires childId context which we don't have in generic ID
        throw new Error("Composite Key required");
    }

    protected getSK(id: string): string {
        return `BOOK#${id}`;
    }

    async createVersion(version: IBookVersion): Promise<IBookVersion> {
        const params = {
            TableName: this.tableName,
            Item: {
                PK: `CHILD#${version.childId}`, // Partition by Child for fast retrieval of all their books
                SK: `BOOK#${version.id}`,
                GSI1PK: `BOOK#${version.id}`, // Global lookup
                GSI1SK: `CHILD#${version.childId}`,
                Entity: 'BookVersion',
                ...version
            }
        };
        await this.client.send(new PutCommand(params));
        return version;
    }

    async findVersionsByChildId(childId: string): Promise<IBookVersion[]> {
        const params = {
            TableName: this.tableName,
            KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
            ExpressionAttributeValues: {
                ':pk': `CHILD#${childId}`,
                ':sk': 'BOOK#'
            }
        };
        const result = await this.client.send(new QueryCommand(params));
        return result.Items as IBookVersion[];
    }
}
