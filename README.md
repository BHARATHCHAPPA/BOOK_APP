# Book Management Application

A full-stack authentication and book management system built with Angular, Node.js, AWS Cognito, and DynamoDB.

## Features

- **Authentication**: Email/Password signup with OTP verification
- **Forgot Password**: Reset password flow with email verification
- **User Management**: Role-based access control (USER, ADMIN, etc.)
- **Dashboard**: User profile and backend connectivity status
- **AWS Integration**: Cognito for auth, DynamoDB for data storage

## Tech Stack

### Frontend
- Angular 18+ (Standalone Components)
- AWS Amplify (Auth)
- TypeScript
- Premium UI with animations and gradients

### Backend
- Node.js + Fastify
- TypeScript
- AWS Cognito JWT verification
- DynamoDB (with fallback mock data)
- Structured logging with Pino

## Project Structure

```
dinesh-project/
├── frontend/          # Angular application
│   ├── src/
│   │   ├── app/
│   │   │   ├── login/        # Login/Signup/Forgot Password
│   │   │   └── dashboard/    # User dashboard
│   │   └── environments/     # Environment configs
│   └── package.json
│
└── backend/           # Node.js API
    ├── src/
    │   ├── domain/           # Business logic
    │   ├── infrastructure/   # AWS integrations
    │   └── interfaces/       # HTTP routes
    └── package.json
```

## Setup

### Prerequisites
- Node.js 18+
- AWS Account with Cognito User Pool
- (Optional) DynamoDB table for production

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

The app will run at `http://localhost:4200`

### Backend Setup

1. Create `.env` file in `backend/` directory:

```bash
NODE_ENV=development
PORT=3000
LOG_LEVEL=info

AWS_REGION=us-east-1
# AWS_ACCESS_KEY_ID=your_key_here
# AWS_SECRET_ACCESS_KEY=your_secret_here

COGNITO_USER_POOL_ID=your_user_pool_id
COGNITO_CLIENT_ID=your_client_id

DYNAMODB_TABLE_NAME=ProAuthTable
```

2. Build and run:

```bash
cd backend
npm install
npm run build
npm start
```

The API will run at `http://localhost:3000`

## Environment Variables

### Frontend (`src/environments/environment.ts`)
- `cognito.userPoolId`: Your Cognito User Pool ID
- `cognito.userPoolClientId`: Your Cognito App Client ID

### Backend (`.env`)
- `COGNITO_USER_POOL_ID`: Same as frontend
- `COGNITO_CLIENT_ID`: Same as frontend
- `AWS_ACCESS_KEY_ID`: (Optional) For DynamoDB access
- `AWS_SECRET_ACCESS_KEY`: (Optional) For DynamoDB access

## Usage

1. **Sign Up**: Create account with email and password
2. **Verify Email**: Enter OTP code sent to your email
3. **Login**: Use your credentials to access dashboard
4. **Forgot Password**: Reset password via email verification

## Production Deployment

For production deployment:
1. Set `production: true` in `environment.prod.ts`
2. Configure AWS IAM roles for backend (instead of access keys)
3. Deploy frontend to S3/CloudFront or Vercel
4. Deploy backend to AWS Lambda, EC2, or containerized environment

## License

MIT
