import NextAuth from 'next-auth';
import KeycloakProvider from 'next-auth/providers/keycloak';
import axios from 'axios';
import { JWT } from 'next-auth/jwt';

/*
async function getUserData(token:string) {
  return axios.get(process.env.TLP_API_BASE+'/party/about', {
    params: {
      partyType:'user'
    },
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  .then((res) => {
    return res.data;
  })
  .catch((error) => {
    console.error(error)
  })
}
*/

const refreshAccessToken = async (token: JWT): Promise<JWT> => {
	// console.log("refreshAccessToken");
	// post to https://keycloak.example.com/auth/realms/myrealm/protocol/openid-connect/token
	// with client_id : <my-client-name> grant_type : refresh_token refresh_token: <my-refresh-token>

	if (process.env.NODE_ENV === 'development') {
		console.log('keycloak ID %s', process.env.KEYCLOAK_ID);
	}

	const params = new URLSearchParams();

	params.append('client_id', process.env.KEYCLOAK_ID!);
	params.append('grant_type', 'refresh_token');
	params.append('refresh_token', token.refreshToken);
	params.append('client_secret', process.env.KEYCLOAK_SECRET!);

	return axios
		.post<JWT>(process.env.KEYCLOAK_ISSUER + '/protocol/openid-connect/token', params, {
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
		})
		.then(({ data }) => ({
			...data,
			accessToken: data.access_token ?? token.accessToken, // Fall back to the old access token
			accessTokenExpires: Date.now() + data.expires_in * 1000,
			refreshToken: data.refresh_token ?? token.refreshToken // Fall back to old refresh token
		}))
		.catch((error: unknown) => {
			console.log('Error attempting to refresh token %o', error);
			return token;
		});
};

export default NextAuth({
	providers: [
		KeycloakProvider({
			clientId: process.env.KEYCLOAK_ID!,
			clientSecret: process.env.KEYCLOAK_SECRET!,
			issuer: process.env.KEYCLOAK_ISSUER!
			// authorization: { params: { scope: 'openid email profile' } },
		})
	],
	callbacks: {
		async session({ session, token = null }) {
			return {
				...session,
				accessToken: token?.accessToken ?? null,
				isAdmin: token?.profile?.roles?.includes('ADMIN'),
				profile: token?.profile ?? {}
			};
		},
		async jwt({ token, account = null, profile }) {
			// See https://next-auth.js.org/tutorials/refresh-token-rotation for info on how to refresh
			// console.log("JWT CALLBACK: handler token=%o, user=%o, account=%o, profile=%o",token,user,account,profile);

			// For this to work - in the keycloak client, protocol mappers need to be enabled - currently using
			// zoneinfo, locale, client roles, profile, groups, realm roles
			//
			// For refresh tokens to work - go to client config - bottom of settings - OpenID Compat. - Use refresh tokens for client credentials

			// If account and user are set, then this is our first login

			let existingToken = { ...token };

			if (process.env.NODE_ENV === 'development') {
				console.log('Is Account available', Boolean(account));
			}

			// If the account is available then update the token to include various additional properties like the access_token
			if (account) {
				existingToken = {
					...existingToken,
					profile: profile ?? null,
					access_token: account.access_token,
					refresh_token: account.refresh_token,
					accessTokenExpires: account.expires_at * 1000
				};

				if (process.env.NODE_ENV === 'development') {
					console.log('Token has had the account data injected', existingToken);
				}
			}

			// If the token has expired then attempt to renew it (In the event it can't be renewed you will get the old one back)
			if (Date.now() > existingToken.accessTokenExpires) {
				if (process.env.NODE_ENV === 'development') {
					console.log('Refreshing the token as it has expired');
				}

				existingToken = await refreshAccessToken(token);
			}
			/*

			Weird mapping issues:

			- Sometimes the account is available sometimes it isn't

			- To ensure any properties are still mapped even when the account is missing we map them before returning them.


			Example: access_token- > access_token OR refresh_token -> refreshToken

			*/

			existingToken = {
				...existingToken,
				accessToken: existingToken?.access_token ?? null,
				refreshToken: existingToken?.refresh_token
			};

			if (process.env.NODE_ENV === 'development') {
				console.log('Existing token has been remapped to include additional values', existingToken);
			}

			return existingToken;
		}
	},
	events: {
		async signOut() {
			// The keycloak logout URL is
			// http://{KEYCLOAK_URL}/auth/realms/{REALM_NAME}/protocol/openid-connect/logout?redirect_uri={ENCODED_REDIRECT_URI}
			console.log('signOut');
		}
	},
	secret: process.env.SECRET
});
