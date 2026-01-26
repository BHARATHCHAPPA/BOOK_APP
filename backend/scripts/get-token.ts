
import { CognitoIdentityProviderClient, InitiateAuthCommand } from "@aws-sdk/client-cognito-identity-provider";
import * as dotenv from 'dotenv';
dotenv.config();

const client = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION });

async function getToken() {
    const EMAIL = 'chappabharath1999@gmail.com';
    const PASSWORD = 'SecurePass_123!'; // The fixed password we set in frontend

    try {
        const command = new InitiateAuthCommand({
            AuthFlow: "USER_PASSWORD_AUTH",
            ClientId: process.env.COGNITO_CLIENT_ID,
            AuthParameters: {
                USERNAME: EMAIL,
                PASSWORD: PASSWORD,
            },
        });

        const response = await client.send(command);
        if (response.AuthenticationResult) {
            console.log('ACCESS_TOKEN=' + response.AuthenticationResult.AccessToken);
            console.log('ID_TOKEN=' + response.AuthenticationResult.IdToken);
        } else {
            console.error("No token in response", response);
        }

    } catch (error) {
        console.error("Error getting token:", error);
    }
}

getToken();
