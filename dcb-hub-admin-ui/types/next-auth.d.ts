// This needs a review: in the interim we won't remove these imports.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import NextAuth, { DefaultSession, DefaultUser, Profile } from "next-auth";

// Append additional properties to the which is found via the jwt callback
interface IUser extends DefaultUser {
	exp: number;
	iat: number;
	auth_time: number;
	jti: string;
	iss: URL;
	aud: string; // TODO: If someone knows all of the current aud types make this a strict list of values to get a real benefit of using Typescript
	sub: string;
	typ: string; // TODO: If someone knows all of the current aud types make this a strict list of values to get a real benefit of using Typescript
	azp: string;
	session_state: string;
	at_hash: string;
	acr: string; // TODO: If someone knows all of the current aud types make this a strict list of values to get a real benefit of using Typescript
	sid: string;
	email_verified: boolean;
	roles: string[]; // TODO: If someone knows all of the current types make this a strict list of values to get a real benefit of using Typescript
	name: string;
	id: string;
	preferred_username: string;
	given_name: string;
	family_name: string;
	email: string;
}

declare module "next-auth" {
	interface Session {
		accessToken: string;
		refreshToken: string;
		isAdmin: boolean;
		error: string;
		profile: KeycloakProfile;
		user: IUser;
	}

	interface KeycloakProfile {
		roles: string[];
	}

	interface Account {
		provider: string;
		type: string;
		id: string;
		accessToken: string;
		accessTokenExpires?: any;
		refreshToken: string;
		idToken: string;
		access_token: string;
		expires_in: number;
		refresh_expires_in: number;
		refresh_token: string;
		token_type: string;
		id_token: string;
		"not-before-policy": number;
		session_state: string;
		scope: string;
	}
}

declare module "next-auth/jwt" {
	interface JWT {
		provider: string;
		accessToken: string | null;
		id_token: string;
		access_token: string | null;
		refreshToken: string;
		profile: Partial<Profile> | null; // Please update this if this is incorrect, it's a parrtial match so the entire object doesn't need to be an exact match for the JWT profile argument
		accessTokenExpires: number;
		refreshTokenExpires: number;
		expires_in: number;
		refresh_token: string;
		name: string;
		email: string;
		sub: string;
		error: string;
		user: IUser;
	}

	// Appends the  user interface to the Profile user so properties like groups is available to decide if the user is admin or not
	interface Profile extends IUser {}
}
