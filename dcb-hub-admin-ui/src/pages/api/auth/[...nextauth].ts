import NextAuth from 'next-auth';
import KeycloakProvider from 'next-auth/providers/keycloak';
import axios, {AxiosError} from 'axios';
import { JWT } from 'next-auth/jwt';
import { cookies } from 'next/headers'



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
const keycloak = KeycloakProvider({
    clientId: process.env.KEYCLOAK_ID!,
    clientSecret: process.env.KEYCLOAK_SECRET!,
    issuer: process.env.KEYCLOAK_ISSUER,
});

// const refreshAccessToken = async (token: JWT): Promise<JWT> => {
// 	// console.log("refreshAccessToken");
// 	// post to https://keycloak.example.com/auth/realms/myrealm/protocol/openid-connect/token
// 	// with client_id : <my-client-name> grant_type : refresh_token refresh_token: <my-refresh-token>

// 	if (process.env.NODE_ENV === 'development') {
// 		console.log('keycloak ID %s', process.env.KEYCLOAK_ID);
// 	}

// 	const params = new URLSearchParams();

// 	params.append('client_id', process.env.KEYCLOAK_ID!);
// 	params.append('grant_type', 'refresh_token');
// 	params.append('refresh_token', token.refreshToken);
// 	params.append('client_secret', process.env.KEYCLOAK_SECRET!);

// 	return axios
// 		.post<JWT>(process.env.KEYCLOAK_ISSUER + '/protocol/openid-connect/token', params, {
// 			headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
// 		})
// 		.then(({ data }) => ({
// 			...data,
// 			accessToken: data.access_token ?? token.accessToken, // Fall back to the old access token
// 			accessTokenExpires: Date.now() + data.expires_in * 1000,
// 			refreshToken: data.refresh_token ?? token.refreshToken // Fall back to old refresh token
// 		}))
// 		.catch((error: unknown) => {
// 			console.log('Error attempting to refresh token %o', error);
// 			return token;
// 		});
// };


// there needs to be a method capable of refreshing access tokens, or we need to take a different approach. 
// Otherwise we'll get 401s after 5 minutes on the request and HostLMS pages, as the tokens expire and are not renewed (and the user isn't signed out)
async function completeSignout(jwt: JWT) {
    const { provider, id_token } = jwt;
	// log token to check provider correctly appended
	// console.log("Here comes the token", jwt);

    if (provider == keycloak.id) {
        try {
            // Add the id_token_hint to the query string
            const params = new URLSearchParams();
            params.append('id_token_hint', id_token);
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
			// console.log("SESSION CALLBACK: update access token:%o, user:%o",token,user);
			session.accessToken = token.accessToken
			session.profile = token.profile
	  
			if ( token?.profile?.groups?.includes('ADMIN') )
			  session.isAdmin = true;
	  
			if ( user ) {
			  // console.log("not repeating user fetch");
			}
			else {
			  // Send properties to the client, like an access_token from a provider.
			  // session.tlpUserData = await getTlpUserData(token.accessToken as string)
			  // session.userData = await getUserData(token.accessToken as string)
			  // console.log("created session %o %o",session,user);
			}
	  
			return session
		},
		 jwt: async({ token, account, user, profile  }:{token:any, account?:any, user?:any, profile?:any}) => {
			// console.log("jwt handler %o, %o",token,account);
			// process.env.KEYCLOAK_ISSUER + '/protocol/openid-connect/token
			// See https://next-auth.js.org/tutorials/refresh-token-rotation for info on how to refresh
			// console.log("JWT CALLBACK: handler token=%o, user=%o, account=%o, profile=%o",token,user,account,profile);
	  
			// For this to work - in the keycloak client, protocol mappers need to be enabled - currently using
			// zoneinfo, locale, client roles, profile, groups, realm roles
			//
			// For refresh tokens to work - go to client config - bottom of settings - OpenID Compat. - Use refresh tokens for client credentials
	  
			// If account and user are set, then this is our first login

			// token will expire in 30 minutes, auto-logout unless something changes.
			// first stage in implementing OWASP auto logout

			if (account) {
			  token.accessToken = account.access_token;
			  token.refreshToken  = account.refresh_token;
			  token.id_token = account.id_token;
			  token.profile = profile;
			  token.provider = account?.provider;
			  // console.log("accessTokenExpires=%o",account.expires_at);
			  token.accessTokenExpires = account?.expires_at * 1000;
			  // console.log("accessTokenExpires=%o",token.accessTokenExpires);
			}
	  
			// if (Date.now() > token.accessTokenExpires) {
			//   // console.log("Token has expired - need to refresh");
			//   token = await refreshAccessToken(token)
			//   // console.log("Refreshed token: %o",token);
			// }
			// else {
			//   // console.log("remaining: %o %o", token.accessTokenExpires-Date.now(), token);
			//   // console.log("remaining: %o", token.accessTokenExpires-Date.now());
			// }
	  
			return token
		  }
		},
		events: {
			signOut: ({ session, token }) => completeSignout(token)
		}
});
