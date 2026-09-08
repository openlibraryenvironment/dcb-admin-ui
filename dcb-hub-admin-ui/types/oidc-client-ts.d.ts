import "oidc-client-ts"; // Remember the import. Very important or you'll get a very confusing error trying to augment something that doesn't yet exist.
// Such as 'type User does not exist as an import' ...
declare module "oidc-client-ts" {
	interface IdTokenClaims {
		roles?: string[];
	}
}
