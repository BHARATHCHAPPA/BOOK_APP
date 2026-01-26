import { FastifyRequest, FastifyReply } from 'fastify';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { config } from '../../config/env';
import { UserRole } from '../../domain/auth/permissions';
import { logger } from '../../shared/logger';

// Initialize Verifier
const verifier = CognitoJwtVerifier.create({
    userPoolId: config.COGNITO_USER_POOL_ID,
    tokenUse: 'access',
    clientId: config.COGNITO_CLIENT_ID,
});

// Augment Fastify Request type
declare module 'fastify' {
    interface FastifyRequest {
        user?: {
            id: string; // The 'sub'
            role: UserRole;
            email?: string;
        };
    }
}

export const authMiddleware = async (request: FastifyRequest, reply: FastifyReply) => {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return reply.status(401).send({ error: 'Missing or invalid Authorization header' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const payload = await verifier.verify(token);

        // Map Cognito Groups to Internal Roles
        let role = UserRole.USER;
        const groups = payload['cognito:groups'] || [];

        // Extended Group Mapping to match PDF Roles
        if (groups.includes('SuperAdmin')) role = UserRole.SUPER_ADMIN;
        else if (groups.includes('FinanceAdmin')) role = UserRole.FINANCE_ADMIN;
        else if (groups.includes('OpsAdmin')) role = UserRole.OPS_ADMIN;
        else if (groups.includes('Support')) role = UserRole.SUPPORT;
        else if (groups.includes('Developer')) role = UserRole.DEVELOPER;
        else if (groups.includes('Admin')) role = UserRole.SUPER_ADMIN; // Legacy/Fallback

        request.user = {
            id: payload.sub,
            role,
            email: payload.username // or specific claim
        };

    } catch (err) {
        logger.warn({ err }, 'Token verification failed');
        return reply.status(401).send({ error: 'Unauthorized', message: 'Token invalid or expired' });
    }
};
