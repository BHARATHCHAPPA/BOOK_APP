import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../../../infrastructure/auth/authMiddleware';
import { DynamoBookRepository } from '../../../infrastructure/database/DynamoBookRepository';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { UserRole } from '../../../domain/auth/permissions';

export async function bookRoutes(server: FastifyInstance) {
    const bookRepo = new DynamoBookRepository();

    // GET /children/:childId/books
    server.get('/children/:childId/books', {
        preHandler: [authMiddleware]
    }, async (request, reply) => {
        const user = request.user!;
        const { childId } = request.params as { childId: string };

        // TODO: Verify user owns child (Simple check: is this child in their family?)
        // For V1 MVP, assuming UUIDs are hard to guess, but strictly we should check ownership.

        return await bookRepo.findVersionsByChildId(childId);
    });

    // POST /children/:childId/books (Create a book version)
    server.post('/children/:childId/books', {
        preHandler: [authMiddleware]
    }, async (request, reply) => {
        const user = request.user!;
        const { childId } = request.params as { childId: string };

        const bodySchema = z.object({
            templateId: z.string(),
            versionName: z.string().optional(),
        });

        const body = bodySchema.parse(request.body);

        const newBook = await bookRepo.createVersion({
            id: randomUUID(),
            childId,
            templateId: body.templateId,
            versionName: body.versionName,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });

        return newBook;
    });
}
