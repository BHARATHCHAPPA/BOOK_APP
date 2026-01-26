export interface IChild {
    id: string;
    userId: string; // Parent user ID
    name: string;
    age: number;
    dateOfBirth: string;
    avatar?: string;
    favoriteGenres?: string[];
    readingLevel?: 'beginner' | 'intermediate' | 'advanced';
    createdAt: string;
    updatedAt: string;
}

export interface IBook {
    id: string;
    title: string;
    author: string;
    description: string;
    coverImage: string;
    price: number; // In credits
    ageRange: {
        min: number;
        max: number;
    };
    genre: string[];
    readingLevel: 'beginner' | 'intermediate' | 'advanced';
    pageCount: number;
    publishedDate: string;
    isbn?: string;
    rating?: number;
    reviewCount?: number;
    createdAt: string;
    updatedAt: string;
}

export interface IPurchase {
    id: string;
    userId: string;
    bookId: string;
    childId?: string; // Optional: which child is this for
    purchaseDate: string;
    creditsSpent: number;
    status: 'completed' | 'refunded';
}

export interface ICreditTransaction {
    id: string;
    userId: string;
    amount: number; // Positive for purchase, negative for spending
    type: 'purchase' | 'spend' | 'refund' | 'bonus';
    description: string;
    relatedEntityId?: string; // Book ID if spending on book
    createdAt: string;
}
