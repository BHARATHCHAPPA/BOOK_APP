import pino from 'pino';
import { config } from '../config/env';

export const logger = pino({
    level: config.LOG_LEVEL,
    formatters: {
        level: (label) => {
            return { level: label.toUpperCase() };
        },
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    messageKey: 'message',
});

// Helper to log audit events specifically
export const logAudit = (actorId: string, action: string, resource: string, details: object) => {
    logger.info({
        type: 'AUDIT_LOG',
        actorId,
        action,
        resource,
        ...details,
    }, `Audit: ${actorId} performed ${action} on ${resource}`);
};
