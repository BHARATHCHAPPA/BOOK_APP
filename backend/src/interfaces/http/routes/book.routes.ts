import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../../../infrastructure/auth/authMiddleware';
import { DynamoBookRepository } from '../../../infrastructure/database/DynamoBookRepository';
import { DynamoUserRepository } from '../../../infrastructure/database/DynamoUserRepository';
import { z } from 'zod';

export async function bookRoutes(server: FastifyInstance) {
    const bookRepo = new DynamoBookRepository();
    const userRepo = new DynamoUserRepository();

    // GET /books - List all books (Catalog)
    server.get('/books', {
        preHandler: [authMiddleware]
    }, async (request, reply) => {
        // Parse pagination query params if needed
        const result = await bookRepo.findAll();

        // Retrieve purchased books for the user
        const user = request.user!;
        const purchasedBooks = await userRepo.getPurchasedBooks(user.id);

        // Enrich book list with purchase status
        const enrichedBooks = result.items.map(book => ({
            ...book,
            isPurchased: purchasedBooks.includes(book.id) || book.price === 0
        }));

        return enrichedBooks;
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

    // POST /books/:id/purchase - Buy a book
    server.post('/books/:id/purchase', {
        preHandler: [authMiddleware]
    }, async (request, reply) => {
        const user = request.user!;
        const { id } = request.params as { id: string };

        // 1. Get Book Price
        const book = await bookRepo.findById(id);
        if (!book) return reply.status(404).send({ error: 'Book not found' });

        // 2. Get User Balance
        const userProfile = await userRepo.findById(user.id);
        if (!userProfile) return reply.status(404).send({ error: 'User not found' });

        // 3. Check Balance
        if (userProfile.credits < book.price) {
            return reply.status(402).send({
                error: 'Insufficient Credits',
                currentBalance: userProfile.credits,
                required: book.price
            });
        }

        // 4. Deduct Credits
        const updatedUser = await userRepo.updateCredits(user.id, -book.price);

        // 5. Record Purchase
        await userRepo.addPurchasedBook(user.id, book.id);

        return {
            success: true,
            message: `Purchased '${book.title}'`,
            remainingCredits: updatedUser.credits
        };
    });
}
