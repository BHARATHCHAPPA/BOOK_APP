import Fastify from 'fastify';
import cors from '@fastify/cors';
import { config } from './config/env';
import { logger } from './shared/logger';
import { authMiddleware } from './infrastructure/auth/authMiddleware';
import { AdminService } from './domain/services/AdminService';
import { DynamoAuditRepository } from './infrastructure/database/DynamoAuditRepository';
import { UserRole, Action } from './domain/auth/permissions';
import { z } from 'zod';

const server = Fastify({
    logger: false // We use our own pino logger
});

server.register(cors);

// Dependency Injection (Manual for now, can use container later)
const auditRepo = new DynamoAuditRepository();
const adminService = new AdminService(auditRepo);

// Register Routes
// import { childRoutes } from './interfaces/http/routes/child.routes';
// import { bookRoutes } from './interfaces/http/routes/book.routes';
import { userRoutes } from './interfaces/http/routes/user.routes';
// import { creditRoutes } from './interfaces/http/routes/credit.routes';

// Apply auth middleware to all routes except health
server.register(async (protectedServer) => {
    protectedServer.addHook('preHandler', authMiddleware);

    // protectedServer.register(childRoutes);
    // protectedServer.register(bookRoutes);
    protectedServer.register(userRoutes, { prefix: '/users' });
    // protectedServer.register(creditRoutes, { prefix: '/credits' });
});

// Health Check
server.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
});

import { globalErrorHandler } from './interfaces/http/errorHandler';
server.setErrorHandler(globalErrorHandler);

// Secured Routes
server.post('/admin/issue-credits', {
    preHandler: [authMiddleware]
}, async (request, reply) => {
    const user = request.user!; // set by middleware

    // Validation for body
    const bodySchema = z.object({
        targetUserId: z.string().uuid(),
        amount: z.number().positive()
    });

    const validation = bodySchema.safeParse(request.body);
    if (!validation.success) {
        return reply.status(400).send(validation.error);
    }

    const { targetUserId, amount } = validation.data;

    try {
        const result = await adminService.issueUserCredits(
            user.id,
            user.role,
            targetUserId,
            amount
        );
        return result;
    } catch (error: any) {
        logger.error({ error }, 'Admin Action Failed');

        if (error.message.includes('Access Denied')) {
            return reply.status(403).send({ error: 'Forbidden', message: error.message });
        }

        return reply.status(500).send({ error: 'Internal Server Error' });
    }
});

const start = async () => {
    try {
        await server.listen({ port: config.PORT as number, host: '0.0.0.0' });
        logger.info(`Server running at http://0.0.0.0:${config.PORT}`);
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};

start();
