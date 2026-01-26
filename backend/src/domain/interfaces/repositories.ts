export interface IRepository<T> {
    create(item: T): Promise<T>;
    update(id: string, item: Partial<T>): Promise<T>;
    delete(id: string): Promise<boolean>;
    findById(id: string): Promise<T | null>;
}

export interface IAuditLog {
    transactionId: string;
    actorId: string;
    action: string;
    resource: string;
    timestamp: string;
    details: Record<string, any>;
    metadata?: Record<string, any>;
}

export interface IAuditRepository {
    appendLog(log: IAuditLog): Promise<void>;
}
