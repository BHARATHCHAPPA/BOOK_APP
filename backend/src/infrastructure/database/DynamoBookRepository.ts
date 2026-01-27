import { DynamoBaseRepository } from './DynamoBaseRepository';
import { IBook, IBookRepository } from '../../domain/interfaces/bookRepository';
import { PutCommand, ScanCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from './dynamoClient';
import { config } from '../../config/env';

// Mock Data for MVP
const MOCK_BOOKS: IBook[] = [
    {
        id: 'b1',
        title: 'The Brave Little Explorer',
        author: 'Sarah Jenkins',
        description: 'A heartwarming tale about a curious bunny who discovers the magic of the forest.',
        coverImage: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800',
        ageRange: '3-6',
        price: 5,
        status: 'PUBLISHED',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: 'b2',
        title: 'Space Adventures: Mars Mission',
        author: 'Dr. Alan Grant',
        description: 'Blast off into space! Learn about the red planet in this exciting journey.',
        coverImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800',
        ageRange: '6-9',
        price: 8,
        status: 'PUBLISHED',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: 'b3',
        title: 'Colors of the Rainbow',
        author: 'Maria Garcia',
        description: 'Learn colors with beautiful illustrations and rhyming text.',
        coverImage: 'https://images.unsplash.com/photo-1502472584811-0a2f2ca8eb0e?auto=format&fit=crop&q=80&w=800',
        ageRange: '0-3',
        price: 3,
        status: 'PUBLISHED',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: 'b4',
        title: 'The Mystery of the Old Clock',
        author: 'J.P. Morgan',
        description: 'A thrilling mystery for young detectives.',
        coverImage: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=800',
        ageRange: '9-12',
        price: 10,
        status: 'PUBLISHED',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }
];

export class DynamoBookRepository implements IBookRepository {
    private readonly tableName = config.DYNAMODB_TABLE_NAME;

    async create(book: IBook): Promise<IBook> {
        const params = {
            TableName: this.tableName,
            Item: {
                PK: `BOOK#${book.id}`,
                SK: `METADATA`,
                Entity: 'Book',
                ...book
            }
        };
        try {
            await docClient.send(new PutCommand(params));
            return book;
        } catch (error) {
            // Fallback for development (in case of no AWS creds)
            console.warn('DynamoDB create failed, using mock success');
            return book;
        }
    }

    async findById(id: string): Promise<IBook | null> {
        // 1. Try Mock first (faster for dev)
        const mock = MOCK_BOOKS.find(b => b.id === id);
        if (mock) return mock;

        // 2. Try DynamoDB
        const params = {
            TableName: this.tableName,
            Key: { PK: `BOOK#${id}`, SK: `METADATA` }
        };
        try {
            const result = await docClient.send(new GetCommand(params));
            return result.Item as IBook || null;
        } catch (error) {
            return null;
        }
    }

    async findAll(limit?: number, offset?: string): Promise<{ items: IBook[], nextToken?: string }> {
        // Return Mock Data mixed with DynamoDB potential data? 
        // For MVP, just return Mock Data
        return { items: MOCK_BOOKS };

        /* 
        // Real Implementation
        const params = {
            TableName: this.tableName,
            IndexName: 'GSI1', // Assuming we have an index for "All Books" or just Scan
            // Note: Scan is bad for production but okay for small catalogs
        };
        */
    }

    async update(id: string, updates: Partial<IBook>): Promise<IBook> {
        throw new Error('Method not implemented.');
    }

    async delete(id: string): Promise<boolean> {
        throw new Error('Method not implemented.');
    }
}
