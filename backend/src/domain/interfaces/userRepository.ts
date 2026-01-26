export interface IUser {
    id: string; // Internal UUID
    cognitoSub: string; // Link to Auth Provider
    email: string;
    role: string;
    credits: number;
    status: 'ACTIVE' | 'SUSPENDED';
    createdAt: string;
    updatedAt: string;
}

export interface IUserRepository {
    findByCognitoSub(sub: string): Promise<IUser | null>;
    findById(id: string): Promise<IUser | null>;
    create(user: IUser): Promise<IUser>;
    updateCredits(userId: string, amountToAdd: number): Promise<IUser>;
}
