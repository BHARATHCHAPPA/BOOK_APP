import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const configSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    // Correctly default as string before transformation
    PORT: z.string().default('3000').transform(Number),
    AWS_REGION: z.string().default('us-east-1'),
    COGNITO_USER_POOL_ID: z.string(),
    COGNITO_CLIENT_ID: z.string(),
    DYNAMODB_TABLE_NAME: z.string(),
    LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

const parseConfig = () => {
    // If .env is missing critical values, this will throw/fail
    const result = configSchema.safeParse(process.env);

    if (!result.success) {
        console.error('❌ Invalid environment variables:', JSON.stringify(result.error.format(), null, 2));
        process.exit(1);
    }

    return result.data;
};

export const config = parseConfig();
