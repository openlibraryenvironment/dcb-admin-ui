import NextAuth from 'next-auth';
import KeycloakProvider from 'next-auth/providers/keycloak';
import axios, {AxiosError} from 'axios';
import { JWT } from 'next-auth/jwt';

const keycloak = KeycloakProvider({
    clientId: process.env.KEYCLOAK_ID!,
    clientSecret: process.env.KEYCLOAK_SECRET!,
    issuer: process.env.KEYCLOAK_ISSUER,
});

/**
 * This method takes a token, and returns a new token from Keycloak with updated
 * `accessToken` and `accessTokenExpires`. If an error occurs,
 * we return the old token and an error property. 
 */
/**
 * @param  {JWT} token
 */

// See DCB-241 for more details - this method kills the sporadic 401 failures we were seeing by forcing the token to refresh.
// If the token can't be refreshed, an error is returned and the user must sign in again / authenticate with Keycloak
const refreshAccessToken = async (token: JWT) => {
	console.info("RAT Method triggered")
	const params = new URLSearchParams();
	params.append('client_id', process.env.KEYCLOAK_ID!)
	params.append('grant_type', 'refresh_token')
	params.append('refresh_token', token.refreshToken)
	params.append('client_secret', process.env.KEYCLOAK_SECRET!)
	return axios.post(process.env.KEYCLOAK_ISSUER+'/protocol/openid-connect/token',
	params,
	{ headers: { 'Content-Type': 'application/x-www-form-urlencoded' } } )
	.then((refresh_response) => {
		console.info("Keycloak request made in nextauth, new token is", refresh_response.data.access_token)
		const new_token = refresh_response.data;
		return {
			...token,
			accessToken: new_token.access_token,
			accessTokenExpires: Date.now() + new_token.expires_in * 1000,
			refreshToken: new_token.refresh_token ?? token.refreshToken, // Fall back to old refresh token
		  }
		})
		.catch((error) => {
			console.info("RATS! Error attempting to refresh token %o",error);
			console.log(token);
			return token;
		 })
}

// This method ensures we signout correctly, with token(s) correctly invalidated and the user redirected to the login screen.
async function completeSignout(jwt: JWT) {
    const { provider, id_token } = jwt;
    if (provider == keycloak.id) {
        try {
            // Add the id_token_hint to the query string
            const params = new URLSearchParams();
            params.append('id_token_hint', id_token);
			// TS-ignore as temp fix: error behaviour is already covered by the AxiosError on line 86
			// so failure state is covered.
			// @ts-ignore
            const { status, statusText } = await axios.get(`${keycloak.options.issuer}/protocol/openid-connect/logout?${params.toString()}`);

            // Confirm we've logged out properly - the Keycloak login should appear and force us to put in login info.
            console.log("Completed post-logout handshake", status, statusText);
        }
        catch (e: any) {
            console.error("Unable to perform post-logout handshake", (e as AxiosError)?.code || e)
        }
    }
}

export default NextAuth({
	secret: process.env.NEXTAUTH_SECRET,
	providers: [
		keycloak
	],
	callbacks: {
		async session({ session, token, user }:{session:any, token?:any, user?:any}) {
			// Set session properties if token exists
			if (token) {
				session.accessToken = token.accessToken
				session.refreshToken = token.refreshToken
				session.profile = token.profile
				session.error = token.error;
				session.user = token.user;
				// if user has 'ADMIN' role, set isAdmin to true
				if ( token?.profile?.roles?.includes('ADMIN') )
				{
					session.isAdmin = true;
				}
			}
			return session
		},
		 jwt: async({ token, account, user, profile  }:{token:any, account?:any, user?:any, profile?:any}) => {
			// on initial sign in
			if (account) {
			  // Add everything to the token after sign-in
			  token.accessToken = account.access_token;
			  token.refreshToken  = account.refresh_token;
			  token.id_token = account.id_token;
			  token.profile = profile;
			  token.provider = account?.provider;
			  token.accessTokenExpires = Date.now() + (account.expires_in - 15) * 1000;
			  token.refreshTokenExpires = Date.now() + (account.refresh_expires_in - 15) *1000;
			  token.user = user;
			  return token;
			}

			// Refresh token if it's expired
			if (Date.now() > token.accessTokenExpires) {
				token = await refreshAccessToken(token)
			}

			// And then return token
			return token;
		  }
		},
		events: {
			// when signOut from nextAuth detected, trigger the completeSignout method to complete it properly.
			signOut: ({ session, token }) => completeSignout(token)
		}
});
