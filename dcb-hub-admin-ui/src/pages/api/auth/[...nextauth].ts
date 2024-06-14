import NextAuth from "next-auth";
import KeycloakProvider from "next-auth/providers/keycloak";
import axios, { AxiosError } from "axios";
import { JWT } from "next-auth/jwt";
import dayjs from "dayjs";
// For anyone curious about what this file does, start here https://next-auth.js.org/configuration/initialization

const keycloak = KeycloakProvider({
	clientId: process.env.KEYCLOAK_ID!,
	clientSecret: process.env.KEYCLOAK_SECRET!,
	issuer: process.env.KEYCLOAK_URL!,
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

// Invalid grant is because the refresh token is not active. Why it's not active in the EBSCO scenario is unclear.
const refreshAccessToken = async (token: JWT) => {
	const params = new URLSearchParams();
	params.append("client_id", process.env.KEYCLOAK_ID!);
	params.append("grant_type", "refresh_token");
	params.append("refresh_token", token.refreshToken);
	params.append("client_secret", process.env.KEYCLOAK_SECRET!);
	return axios
		.post(process.env.KEYCLOAK_URL + "/protocol/openid-connect/token", params, {
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
		})
		.then((refresh_response) => {
			const new_token = refresh_response.data;
			if (refresh_response.status != 200 || refresh_response.data?.error) {
				console.log(
					"Refresh token request has failed! Reason: " +
						refresh_response.statusText +
						" and time " +
						dayjs().format(),
				);
				console.log(
					"Further error information: " +
						refresh_response.data.error +
						" and " +
						refresh_response.data.error_description,
				);
			} else {
				console.log(
					"Token is being refreshed at " +
						dayjs().format() +
						" and status is" +
						refresh_response.statusText,
				);
			}
			return {
				...token,
				accessToken: new_token.access_token,
				id_token: new_token.id_token,
				accessTokenExpires: Date.now() + new_token.expires_in * 1000,
				refreshToken: new_token.refresh_token ?? token.refreshToken, // Fall back to old refresh token
			};
		})
		.catch((error) => {
			console.log("Error attempting to refresh token %o", error);
			// We may want to force a sign-out here. If we do, we need to make the client aware.
			return { ...token, error: "RefreshAccessTokenError" };
		});
};

// This method ensures we signout correctly, with token(s) correctly invalidated and the user redirected to the login screen.

async function completeSignout(jwt: JWT) {
	const { id_token } = jwt;
	try {
		// Add the id_token_hint to the query string
		const params = new URLSearchParams();
		params.append("id_token_hint", id_token);
		// @ts-ignore as temp fix: error behaviour is already covered by the AxiosError on line 86 and so failure state is covered
		// prettier-ignore
		const { status, statusText } = await axios.get(`${keycloak.options.issuer}/protocol/openid-connect/logout?${params.toString()}`,
		);
		// Confirm we've logged out properly - the Keycloak login should appear and force us to put in login info.
		console.log("Completed post-logout handshake", status, statusText);
	} catch (e: any) {
		console.error(
			"Unable to perform post-logout handshake",
			(e as AxiosError)?.code || e,
		);
	}
}

// Defines our NextAuth configuration.
export default NextAuth({
	secret: process.env.NEXTAUTH_SECRET,
	pages: {
		signIn: "/auth/login",
		signOut: "/auth/logout",
	},
	providers: [keycloak],
	callbacks: {
		async session({ session, token }: { session: any; token?: any }) {
			// Set session properties if token exists
			if (token) {
				session.accessToken = token.accessToken;
				session.refreshToken = token.refreshToken;
				session.profile = token.profile;
				session.error = token.error;
				session.user = token.user;
				// session.expires = token.exp;
				// session.expires = token.accessTokenExpires;
				// if user has 'ADMIN' role, set isAdmin to true
				if (token?.profile?.roles?.includes("ADMIN")) {
					session.isAdmin = true;
				}
				if (token?.error === "RefreshAccessTokenError") {
					session.error = "RefreshAccessTokenError";
				}
			}
			const sessionExpiry = Date.parse(session.expires);
			if (sessionExpiry < Date.now()) {
				console.warn("Session expired");
				// TODO: Investigate better ways of handling session expiry.
				// session.error = "SessionExpiryError"
				return undefined;
			}
			return session;
		},
		jwt: async ({
			token,
			account,
			user,
			profile,
		}: {
			token: any;
			account?: any;
			user?: any;
			profile?: any;
		}) => {
			// To stop 'last minute refreshes' - in milliseconds.
			const bufferTime = 60 * 1000;
			// on initial sign in
			if (account && user) {
				console.log(
					"Initial sign-in for " + user.id + " at " + dayjs().format(),
				);
				return {
					accessToken: account.access_token,
					id_token: account.id_token,
					accessTokenExpires: account.expires_at,
					refreshToken: account.refresh_token, // Expected to be 30 mins/1800 seconds - correlates to session max
					profile: profile,
					user,
				};
			}
			if (Date.now() >= token.accessTokenExpires - bufferTime) {
				return refreshAccessToken(token);
			}
			return token;
		},
	},
	session: {
		strategy: "jwt",
		maxAge: 30 * 60, // Seconds - How long until an idle session expires and is no longer valid.
		// No need to specify JWT max age as it defaults to this.
	},
	events: {
		// when signOut from nextAuth detected, trigger the completeSignout method to complete it properly.
		signOut: ({ token }) => completeSignout(token),
	},
});
