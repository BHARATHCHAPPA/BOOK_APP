import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../../../infrastructure/auth/authMiddleware';
import { DynamoBookRepository } from '../../../infrastructure/database/DynamoBookRepository';
import { z } from 'zod';

export async function bookRoutes(server: FastifyInstance) {
    const bookRepo = new DynamoBookRepository();

    // GET /books - List all books (Catalog)
    // Publicly accessible? Or authenticated? Let's make it authenticated for consistent auth flow.
    server.get('/books', {
        preHandler: [authMiddleware]
    }, async (request, reply) => {
        // Parse pagination query params if needed
        const result = await bookRepo.findAll();
        return result.items;
    });

    // GET /books/:id - Get specific book details
    server.get('/books/:id', {
        preHandler: [authMiddleware]
    }, async (request, reply) => {
        const { id } = request.params as { id: string };
        const book = await bookRepo.findById(id);

        if (!book) {
            return reply.status(404).send({ error: 'Book not found' });
        }
        return book;
    });
}
