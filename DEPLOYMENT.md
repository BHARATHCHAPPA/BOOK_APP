# Backend Deployment Guide (AWS Amplify)

This document outlines the steps required to deploy the backend to AWS Amplify.
**Status**: The code currently requires "Serverless Adaptation" before it can be deployed.

## 1. Prerequisites
- AWS Account
- Amplify CLI installed: `npm install -g @aws-amplify/cli`
- Project initialized: `amplify init`

## 2. Implementation Steps (For Developer)

The current Fastify backend cannot run directly on AWS Lambda without an adapter. You must perform the following code changes:

### A. Install Adapter
In the `backend/` directory:
```bash
npm install @fastify/aws-lambda
```

### B. Create Lambda Entry Point
Create a new file `backend/src/lambda.ts`:
```typescript
import { awsLambdaRequestHandler } from '@fastify/aws-lambda';
import { server } from './index';

export const handler = awsLambdaRequestHandler(server);
```

### C. Modify `backend/src/index.ts`
Modify the entry file to export the server instance and only listen on a port when running locally.

**Current:**
```typescript
start();
```

**Change to:**
```typescript
// Only start server if run directly (local dev), not when imported by Lambda
if (require.main === module) {
    start();
}
export { server };
```

## 3. Deployment Steps (Amplify)

Once the code changes above are made:

1.  **Add API** using Amplify CLI:
    ```bash
    amplify add api
    ```
    - Select **REST**.
    - Select **Serverless ExpressJS function**.
    - Config: Path `/`, Name `bookbackend`.

2.  **Replace Function Code**:
    - Copy your `backend/*` files into the newly created `amplify/backend/function/bookbackend/src/` folder.
    - Run `npm install` in that folder.

3.  **Update Entry Point**:
    - Update `amplify/backend/function/bookbackend/src/package.json` main to `dist/lambda.js`.

4.  **Deploy**:
    ```bash
    amplify push
    ```

## 4. Frontend Connection
After deployment, Amplify provides an API ENDPOINT URL.
Update `frontend/src/environments/environment.ts` (or equivalent) with this URL.
