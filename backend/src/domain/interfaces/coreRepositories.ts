export interface IBaseEntity {
    id: string; // The UUID
    createdAt: string;
    updatedAt: string;
}

export interface IChildProfile extends IBaseEntity {
    parentId: string;
    firstName: string;
    fullName?: string;
    dob?: string;
    avatarConfig?: Record<string, any>;
    isActive: boolean;
}

export interface IBookTemplate extends IBaseEntity {
    code: string; // e.g., BRAVESOUP_NAME
    displayName: string;
    isActive: boolean;
}

export interface IBookVersion extends IBaseEntity {
    childId: string;
    templateId: string;
    versionName?: string;
    isActive: boolean;
    slotIndex?: number | null;
}

// Single-Table Repository Interface
// We will have specific Repositories that might extend a base generic one, 
// or we just define the specialized methods we need.

export interface IChildRepository {
    create(child: IChildProfile): Promise<IChildProfile>;
    findByParentId(parentId: string): Promise<IChildProfile[]>;
    findById(childId: string): Promise<IChildProfile | null>;
    softDelete(childId: string): Promise<void>;
}

export interface IBookRepository {
    createVersion(version: IBookVersion): Promise<IBookVersion>;
    findVersionsByChildId(childId: string): Promise<IBookVersion[]>;
}
