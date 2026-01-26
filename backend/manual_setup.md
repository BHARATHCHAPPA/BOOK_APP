# manual_setup.md

Follow these valid manual steps to create the AWS resources required for the backend.

## 1. DynamoDB Table Setup
The application uses a **Single-Table Design**. You must create one table with the exact schema below.

1.  Go to **DynamoDB** -> **Create table**.
2.  **Table details**:
    *   **Table name**: `ProAuthTable`
    *   **Partition key**: `PK` (String)
    *   **Sort key**: `SK` (String)
3.  **Table settings**:
    *   Use **Default settings** (Provisioned or On-demand is fine).
4.  **Create Table**.
5.  **Create Secondary Indexes (GSI)**:
    *   Once the table is created, go to the **Indexes** tab.
    *   Click **Create index**.
    *   **Partition key**: `GSI1PK` (String)
    *   **Sort key**: `GSI1SK` (String)
    *   **Index name**: `GSI1` (Auto-generated usually, or name it `GSI1`).
    *   **Projected attributes**: `All`.
    *   Click **Create index**.

---

## 2. Cognito User Pool Setup
This manages your users and their passwords.

1.  Go to **Amazon Cognito** -> **Create user pool**.
2.  **Configure sign-in experience**:
    *   Select **Email**.
    *   Click Next.
3.  **Configure security**:
    *   Password policy: User defaults or stronger.
    *   MFA: Optional for now (No MFA makes testing easier).
4.  **Configure sign-up experience**:
    *   Keep defaults.
5.  **Configure message delivery**:
    *   Select **Send email with Cognito** (for testing).
6.  **Integrate your app**:
    *   **User pool name**: `ProAuthPool`
    *   **Initial app client**:
        *   **App client name**: `ProAuthWebClient`
        *   **Generate client secret**: **No** (Important for frontend/Postman testing without secret hash).
7.  Review and **Create user pool**.

---

## 3. Cognito Groups (Roles)
The backend permissions system relies on these specific Group names.

1.  Go to your newly created User Pool.
2.  Go to the **Groups** tab.
3.  Create the following groups (exact text match):
    *   `SuperAdmin`
    *   `Admin`
    *   `Support`

---

## 4. Create an Admin User (For Testing)
1.  Go to the **Users** tab.
2.  **Create user**:
    *   Enter an email (e.g., `admin@example.com`).
    *   Mark email as verified.
    *   Set a temporary password.
3.  **Assign Group**:
    *   Click on the new user's username.
    *   Go to **Groups** -> **Add user to group**.
    *   Select `Admin` (or `SuperAdmin`).
    *   **Add**.

---

## 5. Update Your Local Config
Once created, find the IDs and update your `.env` file:

*   `AWS_REGION`: e.g., `us-east-1`
*   `COGNITO_USER_POOL_ID`: Found in User Pool Overview (e.g., `us-east-1_ab123...`)
*   `COGNITO_CLIENT_ID`: Found in App Integration -> App clients (e.g., `2n3k4j5...`)
*   `DYNAMODB_TABLE_NAME`: `ProAuthTable`
