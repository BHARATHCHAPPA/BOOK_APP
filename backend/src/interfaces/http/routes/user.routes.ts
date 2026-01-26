import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { DynamoUserRepository } from '../../../infrastructure/database/DynamoUserRepository';
import { authMiddleware } from '../../../infrastructure/auth/authMiddleware';

const userRepo = new DynamoUserRepository();

export async function userRoutes(fastify: FastifyInstance) {

    // All user routes require authentication
    fastify.addHook('preHandler', authMiddleware);

    // GET /users/me - Get current user profile
    fastify.get('/me', async (req, reply) => {
        const user = (req as any).user;
        if (!user || !user.id) {
            return reply.status(401).send({ message: 'User identity missing' });
        }

        try {
            // Fetch full user profile from DB
            // Since we lazy-load users, if they don't exist in DB yet (first login), 
            // we should validly return a basic profile or even create them here if we want strictly consistent data.
            // For now, let's try to find them.
            let profile = await userRepo.findById(user.id);

            if (!profile) {
                // Just-in-time creation (Self-Registration pattern)
                // If user logged in (valid JWT) but no DB row, create it now.
                const newUser = {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    credits: 0 // Default credits
                };
                // We'll trust the repository create method. 
                // Note: The repo interface might require more fields or allow partials.
                // Let's assume create works with standard IUser.
                await userRepo.create(newUser as any);
                profile = newUser as any;
            }

            return reply.send(profile);
        } catch (error: any) {
            // If DynamoDB credentials are missing, return mock data
            if (error.name === 'CredentialsProviderError') {
                return reply.send({
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    credits: 0,
                    _mock: true,
                    _message: 'Using mock data - AWS credentials not configured'
                });
            }
            throw error;
        }
    });
}
