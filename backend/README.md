# Authentication Service Backend

This is a production-ready Fastify backend service handling Authentication, User Management, and Credits.

## Prerequisites

- Node.js v18+
- AWS Account with DynamoDB and Cognito User Pool
- Valid AWS Credentials (configured via IAM Role or Environment Variables)

## Environment Variables

The following environment variables are **REQUIRED** in `.env` (or injected by the environment):

```bash
# Server Config
NODE_ENV=production        # Set to 'development' for local
PORT=3000
LOG_LEVEL=info

# AWS Configuration
AWS_REGION=us-east-1
# AWS_ACCESS_KEY_ID=...     # Required for Local Dev only
# AWS_SECRET_ACCESS_KEY=... # Required for Local Dev only

# Cognito Configuration
COGNITO_USER_POOL_ID=...   # Your User Pool ID
COGNITO_CLIENT_ID=...      # Your Client ID

# DynamoDB Configuration
DYNAMODB_TABLE_NAME=ProAuthTable
```

## Production Deployment

This service is designed to run in a containerized environment (Docker/K8s) or Serverless (Lambda).

1. **Docker Build**:
   ```bash
   docker build -t auth-service .
   ```

2. **IAM Permissions**:
   The execution role must have the following DynamoDB permissions on `ProAuthTable`:
   - `dynamodb:GetItem`
   - `dynamodb:PutItem`
   - `dynamodb:UpdateItem`
   - `dynamodb:Query`

## Health Check

- `GET /health`: Returns service status.

## Architecture Notes

- **Single Table Design**: Uses `ProAuthTable` for Users, Audits, etc.
- **Lazy User Creation**: User records are created in DynamoDB upon first successful login if they don't exist.
- **Secure Defaults**: Uses `pino` for structured logging and `zod` for strict validation.
