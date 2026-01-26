import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { logger } from '../../shared/logger';
import { ZodError } from 'zod';

export const globalErrorHandler = (error: FastifyError | Error, request: FastifyRequest, reply: FastifyReply) => {
    const isProduction = process.env.NODE_ENV === 'production';

    // 1. Zod Validation Errors
    if (error instanceof ZodError) {
        logger.warn({ err: error, path: request.url }, 'Validation Error');
        return reply.status(400).send({
            statusCode: 400,
            error: 'Bad Request',
            message: 'Validation failed',
            details: error.issues,
        });
    }

    // 2. Known Domain Errors (e.g. Access Denied)
    if (error.message.includes('Access Denied') || error.message.includes('Forbidden')) {
        logger.warn({ err: error, userId: (request as any).user?.id }, 'Security Event: Access Denied');
        return reply.status(403).send({
            statusCode: 403,
            error: 'Forbidden',
            message: error.message
        });
    }

    // 3. Unexpected / System Errors
    logger.error({ err: error, request_id: request.id }, 'Unhandled Exception');

    // Security: Don't leak stack traces in production
    const message = isProduction ? 'Internal Server Error' : error.message;

    reply.status(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message,
        ...(isProduction ? {} : { stack: error.stack })
    });
};
