import NextAuth, { DefaultSession, DefaultUser, Profile } from 'next-auth';

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
	preferred_username: string;
	given_name: string;
	family_name: string;
	email: string;
}

declare module 'next-auth' {
	interface Session {
		accessToken: string;
		isAdmin: boolean;
	}

	interface Account {
		access_token: string | null;
		refresh_token: string;
		expires_at: number;
	}
}

declare module 'next-auth/jwt' {
	interface JWT {
		accessToken: string | null;
		access_token: string | null;
		refreshToken: string;
		profile: Partial<Profile> | null; // Please update this if this is incorrect, it's a parrtial match so the entire object doesn't need to be an exact match for the JWT profile argument
		accessTokenExpires: number;
		expires_in: number;
		refresh_token: string;
	}

	// Appends the  user interface to the Profile user so properties like groups is available to decide if the user is admin or not
	interface Profile extends IUser {}
}
