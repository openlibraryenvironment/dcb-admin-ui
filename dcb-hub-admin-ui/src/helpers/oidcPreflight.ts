export class OidcAuthorityUnavailableError extends Error {
	authority: string;
	discoveryUrl: string;

	constructor(authority: string, discoveryUrl: string, cause: unknown) {
		super(
			cause instanceof Error
				? cause.message
				: "The identity provider could not be reached.",
		);
		this.name = "OidcAuthorityUnavailableError";
		this.authority = authority;
		this.discoveryUrl = discoveryUrl;
	}
}

const trimTrailingSlash = (value: string) => value.replace(/\/$/, "");

export const oidcDiscoveryUrl = (authority: string) =>
	`${trimTrailingSlash(authority)}/.well-known/openid-configuration`;

export const assertOidcAuthorityReachable = async (
	authority: string | undefined,
) => {
	if (!authority) {
		throw new OidcAuthorityUnavailableError(
			"",
			"",
			new Error("The identity provider URL is not configured."),
		);
	}

	const discoveryUrl = oidcDiscoveryUrl(authority);
	const controller = new AbortController();
	const timeout = window.setTimeout(() => controller.abort(), 5000);

	try {
		const response = await fetch(discoveryUrl, {
			cache: "no-store",
			signal: controller.signal,
		});

		if (!response.ok) {
			throw new Error(
				`The identity provider returned HTTP ${response.status}.`,
			);
		}
	} catch (error) {
		throw new OidcAuthorityUnavailableError(authority, discoveryUrl, error);
	} finally {
		window.clearTimeout(timeout);
	}
};

export const isOidcAuthorityUnavailableError = (
	error: unknown,
): error is OidcAuthorityUnavailableError =>
	error instanceof OidcAuthorityUnavailableError;

