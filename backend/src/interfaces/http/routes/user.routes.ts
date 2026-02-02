import { FastifyInstance } from 'fastify';
import { CognitoIdentityProviderClient, ListUsersCommand, AdminAddUserToGroupCommand, AdminRemoveUserFromGroupCommand, AdminDeleteUserCommand } from '@aws-sdk/client-cognito-identity-provider';
import { authMiddleware } from '../../../infrastructure/auth/authMiddleware';
import { UserRole } from '../../../domain/auth/permissions';
import { config } from '../../../config/env';

const cognitoClient = new CognitoIdentityProviderClient({ region: config.AWS_REGION });

export async function userRoutes(fastify: FastifyInstance) {

    // All user routes require authentication
    fastify.addHook('preHandler', authMiddleware);

    // GET /users/me - Get current user profile (Pure Token Reflection)
    fastify.get('/me', async (req, reply) => {
        const user = (req as any).user;
        if (!user || !user.id) {
            return reply.status(401).send({ message: 'User identity missing' });
        }

        const profile = {
            id: user.id || user.sub,
            email: user.email,
            role: user.role || 'USER',
            credits: 50,
            _source: 'Cognito Token'
        };

        return reply.send(profile);
    });

    // ADMIN ROUTES

    // ADMIN ROUTES

    // GET /users - List all users (Directly from Cognito)
    fastify.get('/', async (req, reply) => {
        const user = (req as any).user;

        if (user.role !== UserRole.SUPER_ADMIN) {
            return reply.status(403).send({ error: 'Access Denied: Admins Only' });
        }

        // 1. Check for AWS Credentials explicitly
        if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
            req.log.warn('AWS Credentials missing in process.env');
            return reply.status(503).send({
                error: 'Server Configuration Error',
                message: 'Backend is missing AWS_ACCESS_KEY_ID or AWS_SECRET_ACCESS_KEY. Please check .env file.'
            });
        }

        try {
            const command = new ListUsersCommand({
                UserPoolId: config.COGNITO_USER_POOL_ID,
                Limit: 60
            });
            const response = await cognitoClient.send(command);

            // Map Cognito Users to App Format
            const users = response.Users?.map(u => {
                const emailAttr = u.Attributes?.find(a => a.Name === 'email');
                const email = emailAttr ? emailAttr.Value : 'Unknown';
                const subAttr = u.Attributes?.find(a => a.Name === 'sub');
                const id = subAttr ? subAttr.Value : u.Username;

                // Naive Role Detection (We can't see groups in ListUsers easily)
                const isSuperAdmin = email === 'chappabharath1999@gmail.com' || (u.Username && u.Username.includes('chappa'));

                return {
                    id: id,
                    email: email,
                    role: isSuperAdmin ? 'SUPER_ADMIN' : 'USER',
                    status: u.UserStatus,
                    enabled: u.Enabled,
                    credits: 0 // Not stored in Cognito
                };
            }) || [];

            return users;

        } catch (error: any) {
            req.log.error({ err: error }, 'Cognito ListUsers Failed');

            // Helpful error mapping
            let msg = 'Backend Connection Error to AWS Cognito.';
            if (error.name === 'UnrecognizedClientException' || error.name === 'InvalidSignatureException') {
                msg = 'Invalid AWS Credentials. Please check Access Key and Secret.';
            }

            return reply.status(503).send({
                error: 'Backend Connection Error',
                message: msg,
                details: error.message
            });
        }
    });

    // PUT /users/:id/role - Update User Role (Cognito Group Update)
    fastify.put('/:id/role', async (req, reply) => {
        const user = (req as any).user;
        const { id } = req.params as { id: string };
        const body = req.body as { role: string };

        if (user.role !== UserRole.SUPER_ADMIN) return reply.status(403).send({ error: 'Access Denied' });

        if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
            return reply.status(503).send({
                error: 'Server Configuration Error',
                message: 'Backend is missing AWS_ACCESS_KEY_ID or AWS_SECRET_ACCESS_KEY.'
            });
        }

        const targetGroup = body.role === 'SUPER_ADMIN' ? 'Admin' : 'Users';

        try {
            const command = new AdminAddUserToGroupCommand({
                UserPoolId: config.COGNITO_USER_POOL_ID,
                Username: id,
                GroupName: targetGroup
            });
            await cognitoClient.send(command);

            return { success: true, message: `User added to ${targetGroup} group in Cognito` };
        } catch (error: any) {
            req.log.error(error);
            return reply.status(503).send({
                error: 'Backend Connection Error',
                message: error.message || 'Failed to connect to Cognito'
            });
        }
    });

    // DELETE /users/:id - Delete User (Cognito AdminDeleteUser)
    fastify.delete('/:id', async (req, reply) => {
        const user = (req as any).user;
        const { id } = req.params as { id: string };

        if (user.role !== UserRole.SUPER_ADMIN) return reply.status(403).send({ error: 'Access Denied' });

        if (id === user.id) return reply.status(400).send({ error: 'Cannot delete yourself' });

        if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
            return reply.status(503).send({
                error: 'Server Configuration Error',
                message: 'Backend is missing AWS_ACCESS_KEY_ID or AWS_SECRET_ACCESS_KEY.'
            });
        }

        try {
            const command = new AdminDeleteUserCommand({
                UserPoolId: config.COGNITO_USER_POOL_ID,
                Username: id
            });
            await cognitoClient.send(command);
            return { success: true, message: 'User deleted from Cognito' };
        } catch (error: any) {
            req.log.error(error);
            return reply.status(503).send({
                error: 'Backend Connection Error',
                message: error.message || 'Failed to connect to Cognito'
            });
        }
    });
}
