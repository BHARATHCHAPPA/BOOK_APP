import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { DynamoUserRepository } from '../../../infrastructure/database/DynamoUserRepository';
import { authMiddleware } from '../../../infrastructure/auth/authMiddleware';
import { UserRole } from '../../../domain/auth/permissions';

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
            let profile = await userRepo.findById(user.id);

            if (!profile) {
                const newUser = {
                    id: user.id,
                    email: user.email,
                    role: user.email === 'jovifem243@ixunbo.com' || user.email === 'CHAPPABHARATH1999@GMAIL.COM' ? 'SUPER_ADMIN' : 'USER',
                    credits: 50
                };
                await userRepo.create(newUser as any);
                profile = newUser as any;
            }

            return reply.send(profile);
        } catch (error: any) {
            if (error.name === 'CredentialsProviderError') {
                return reply.send({
                    id: user.id,
                    email: user.email,
                    role: user.email === 'jovifem243@ixunbo.com' || user.email === 'CHAPPABHARATH1999@GMAIL.COM' ? 'SUPER_ADMIN' : 'USER',
                    credits: 50,
                    _mock: true,
                    _message: 'Using mock data - AWS credentials not configured'
                });
            }
            throw error;
        }
    });

    // ADMIN ROUTES

    // GET /users - List all users (Admin Only)
    fastify.get('/', async (req, reply) => {
        const user = (req as any).user;
        // Verify Admin Role (Quick Check)
        const currentUser = await userRepo.findById(user.id);
        if (currentUser?.role !== UserRole.SUPER_ADMIN) {
            return reply.status(403).send({ error: 'Access Denied: Admins Only' });
        }

        return await userRepo.findAll();
    });

    // PUT /users/:id/role - Update User Role (Admin Only)
    fastify.put('/:id/role', async (req, reply) => {
        const user = (req as any).user;
        const { id } = req.params as { id: string };
        const body = req.body as { role: string };

        // Verify Admin Role
        const currentUser = await userRepo.findById(user.id);
        if (currentUser?.role !== UserRole.SUPER_ADMIN) {
            return reply.status(403).send({ error: 'Access Denied: Admins Only' });
        }

        // Validate Role (Simple check)
        if (!Object.values(UserRole).includes(body.role as UserRole)) {
            return reply.status(400).send({ error: 'Invalid User Role' });
        }

        await userRepo.updateRole(id, body.role);
        return { success: true, message: `User ${id} role updated to ${body.role}` };
    });

    // DELETE /users/:id - Delete User (Admin Only)
    fastify.delete('/:id', async (req, reply) => {
        const user = (req as any).user;
        const { id } = req.params as { id: string };

        // Verify Admin
        const currentUser = await userRepo.findById(user.id);
        if (currentUser?.role !== UserRole.SUPER_ADMIN) {
            return reply.status(403).send({ error: 'Access Denied: Admins Only' });
        }

        const targetUser = await userRepo.findById(id);
        if (!targetUser) {
            return reply.status(404).send({ error: 'User not found' });
        }

        // STRICTLY PREVENT DELETION OF SUPER ADMINS
        if (targetUser.role === UserRole.SUPER_ADMIN || targetUser.email === 'chappabharath1999@gmail.com') {
            return reply.status(403).send({ error: 'Operation Denied: Cannot delete a Super Admin account.' });
        }

        await (userRepo as any).delete(id);
        return { success: true, message: `User ${id} deleted` };
    });
}
