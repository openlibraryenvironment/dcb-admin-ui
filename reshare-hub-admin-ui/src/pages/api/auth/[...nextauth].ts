import NextAuth from "next-auth"
import KeycloakProvider from "next-auth/providers/keycloak";
import axios from 'axios';

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

async function refreshAccessToken(token:any) {
  // console.log("refreshAccessToken");
  // post to https://keycloak.example.com/auth/realms/myrealm/protocol/openid-connect/token
  // with client_id : <my-client-name> grant_type : refresh_token refresh_token: <my-refresh-token>

  console.log("keycloak ID %s",process.env.KEYCLOAK_ID);

  const params = new URLSearchParams()
  params.append('client_id', process.env.KEYCLOAK_ID!)
  params.append('grant_type', 'refresh_token')
  params.append('refresh_token', token.refreshToken)
  params.append('client_secret', process.env.KEYCLOAK_SECRET!)

  return axios.post(process.env.KEYCLOAK_ISSUER+'/protocol/openid-connect/token',
                    params,
                    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } } )
  .then((refresh_response) => {
    const new_token = refresh_response.data;
    // console.log("Process new_token %o",new_token);
    return {
      ...token,
      accessToken: new_token.access_token,
      accessTokenExpires: Date.now() + new_token.expires_in * 1000,
      refreshToken: new_token.refresh_token ?? token.refreshToken, // Fall back to old refresh token
    }
  })
  .catch((error) => {
     console.log("Error attempting to refresh token %o",error);
  })
}


export default NextAuth({
  providers: [
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_ID!,
      clientSecret: process.env.KEYCLOAK_SECRET!,
      issuer: process.env.KEYCLOAK_ISSUER!,
      // authorization: { params: { scope: 'openid email profile' } },
    })
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
    async jwt({ token, account, user, profile }:{token:any, account?:any, user?:any, profile?:any}) {
      // console.log("jwt handler %o, %o",token,account);
      // See https://next-auth.js.org/tutorials/refresh-token-rotation for info on how to refresh
      // console.log("JWT CALLBACK: handler token=%o, user=%o, account=%o, profile=%o",token,user,account,profile);

      // For this to work - in the keycloak client, protocol mappers need to be enabled - currently using
      // zoneinfo, locale, client roles, profile, groups, realm roles
      //
      // For refresh tokens to work - go to client config - bottom of settings - OpenID Compat. - Use refresh tokens for client credentials

      // If account and user are set, then this is our first login
      if (account) {
        token.accessToken = account.access_token
        token.refreshToken  = account.refresh_token;
        token.profile = profile
        console.log("accessTokenExpires=%o",token.accessTokenExpires);
        token.accessTokenExpires = account.expires_at * 1000;
      }

      if (Date.now() > token.accessTokenExpires) {
        // console.log("Token has expired - need to refresh");
        token = await refreshAccessToken(token)
        // console.log("Refreshed token: %o",token);
      }
      else {
        // console.log("remaining: %o %o", token.accessTokenExpires-Date.now(), token);
        // console.log("remaining: %o", token.accessTokenExpires-Date.now());
      }

      return token
    }
  },
  events: {
    async signOut() {
      // The keycloak logout URL is
      // http://{KEYCLOAK_URL}/auth/realms/{REALM_NAME}/protocol/openid-connect/logout?redirect_uri={ENCODED_REDIRECT_URI}
      console.log("signOut");
    }
  },
  secret: process.env.SECRET
})
