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
	try {
	  if (Date.now() > token.refreshTokenExpires) throw Error;
	  const details = {
		client_id: process.env.KEYCLOAK_ID!,
		client_secret: process.env.KEYCLOAK_SECRET!,
		grant_type: ['refresh_token'],
		refresh_token: token.refreshToken,
	  };
	  const formBody: string[] = [];
	  Object.entries(details).forEach(([key, value]: [string, any]) => {
		const encodedKey = encodeURIComponent(key);
		const encodedValue = encodeURIComponent(value);
		formBody.push(encodedKey + '=' + encodedValue);
	  });
	  const formData = formBody.join('&');
	  const url = `${process.env.KEYCLOAK_REFRESH}/protocol/openid-connect/token`;
	  const response = await fetch(url, {
		method: 'POST',
		headers: {
		  'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
		},
		body: formData,
	  });
	  const refreshedTokens = await response.json();
	  if (!response.ok) throw refreshedTokens;
	  return {
		...token,
		accessToken: refreshedTokens.access_token,
		accessTokenExpires: Date.now() + (refreshedTokens.expires_in - 15) * 1000,
		refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
		refreshTokenExpires:
		  Date.now() + (refreshedTokens.refresh_expires_in - 15) * 1000,
	  };
	} catch (error) {
		console.log("RATs!");
	  return {
		...token,
		error: 'RefreshAccessTokenError',
	  };
	}
  };

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
			// If the access token hasn't expired, keep it
			if (Date.now() < token.accessTokenExpires) return token;
			// Otherwise, the access token has expired, so trigger refreshAccessToken and try and update it
			return refreshAccessToken(token);
		  }
		},
		events: {
			// when signOut from nextAuth detected, trigger the completeSignout method to complete it properly.
			signOut: ({ session, token }) => completeSignout(token)
		}
});
