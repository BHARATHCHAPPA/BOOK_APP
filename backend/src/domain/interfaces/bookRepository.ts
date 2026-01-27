export interface IBook {
    id: string;
    title: string;
    author: string;
    description: string;
    coverImage: string; // URL to S3 or placeholder
    ageRange: '0-3' | '3-6' | '6-9' | '9-12';
    price: number; // In credits
    status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
    publishedAt?: string;
    createdAt: string;
    updatedAt: string;
}

export interface IBookRepository {
    create(book: IBook): Promise<IBook>;
    findById(id: string): Promise<IBook | null>;
    findAll(limit?: number, offset?: string): Promise<{ items: IBook[], nextToken?: string }>;
    update(id: string, updates: Partial<IBook>): Promise<IBook>;
    delete(id: string): Promise<boolean>;
}
