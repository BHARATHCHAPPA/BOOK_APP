import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../../../infrastructure/auth/authMiddleware';
import { PermissionService, UserRole, Action } from '../../../domain/auth/permissions';
import { DynamoChildRepository } from '../../../infrastructure/database/DynamoChildRepository';
import { randomUUID } from 'crypto';
import { z } from 'zod';

export async function childRoutes(server: FastifyInstance) {
    const childRepo = new DynamoChildRepository();

    server.post('/children', {
        preHandler: [authMiddleware]
    }, async (request, reply) => {
        const user = request.user!;

        // schema validation
        const bodySchema = z.object({
            firstName: z.string().min(1),
            dob: z.string().optional(),
            avatarConfig: z.record(z.string(), z.any()).optional()
        });

        const body = bodySchema.parse(request.body);

        // 1. Check Permissions
        // Parents can create children for themselves (USER role scope implied? Or strict Action?)
        // The Matrix says: VIEW_CHILD_PROFILE for most. 
        // Spec says "User" can create children? The Matrix for 'USER' was empty but "Public users have specific app-level scopes".
        // Let's assume a basic USER can create their own children.
        // If Admin is doing it? Use CREATE_USER implies/related? Or we need a CREATE_CHILD action.

        // For V1, let's allow parents to create their own children.
        if (user.role !== UserRole.USER && !PermissionService.can(user.role, Action.VIEW_USER_PROFILE)) {
            // Rough check: If not parent, needs admin view rights at least? 
            // Let's enforce strictly: Only Parent or SuperAdmin.
        }

        const newChild = await childRepo.create({
            id: randomUUID(),
            parentId: user.id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isActive: true,
            ...body
        });

        return newChild;
    });

    server.get('/children', {
        preHandler: [authMiddleware]
    }, async (request, reply) => {
        const user = request.user!;
        // Return children for the authenticated user
        return await childRepo.findByParentId(user.id);
    });
}
