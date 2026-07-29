/**
 * Base-path awareness for deployments that mount several OpenRS apps at path
 * prefixes on ONE origin (mobius.kihosting.net/dcb-admin,
 * mobius.kihosting.net/dcb-admin-for-libraries, ...).
 *
 * Standalone startup uses Vite's asset base. KI bootloader startup uses "/"
 * because its assets resolve relative to ki-bootstrap.js independently.
 */

const normaliseBase = (base: string): string => {
	const path = base.replace(/^\/+|\/+$/g, "");
	return path ? `/${path}/` : "/";
};

let appBase = normaliseBase(import.meta.env.BASE_URL);

export const configureAppBase = (base: string): void => {
	appBase = normaliseBase(base);
};

export const getAppBase = (): string => appBase;

/**
 * Identifies this app within the storage shared by every app on the origin.
 * "/dcb-admin/" -> "dcb-admin"; "/" -> "root".
 */
const getAppNamespace = (): string =>
	appBase.replace(/^\/|\/$/g, "") || "root";

/**
 * Namespaces a persisted-store key. Sibling apps on the same origin share one
 * localStorage and one sessionStorage, so a bare key like "grid-storage"
 * collides: last writer wins, and hydrating a sibling's differently-shaped
 * state can throw during render.
 */
export const storageKey = (name: string) => `${getAppNamespace()}:${name}`;

/**
 * Absolute URL to a path inside this app - for anything handed to an external
 * system (OIDC redirect_uri, post_logout_redirect_uri). window.location.origin
 * alone points at the bare host, which serves no app when several are mounted
 * under prefixes.
 */
export const appUrl = (path = ""): string =>
	`${window.location.origin}${appBase}${path.replace(/^\//, "")}`;

/**
 * Strips the base off a browser pathname to give a router path. TanStack Router
 * works in basepath-relative paths, but window.location.pathname includes the
 * base, so the two must never be compared or interchanged raw.
 */
export const toRoutePath = (
	pathname: string = window.location.pathname,
): string => {
	const prefix = appBase.slice(0, -1); // "" when base is "/"
	return pathname.startsWith(prefix)
		? pathname.slice(prefix.length) || "/"
		: pathname;
};

/**
 * Clears only THIS app's persisted state. A blanket storage.clear() also
 * destroys sibling apps' state on the shared origin. OIDC's own keys are left
 * alone: they are keyed by authority + client_id, and signoutRedirect() ends
 * the Keycloak session properly.
 */
export const clearAppStorage = (): void => {
	const namespace = getAppNamespace();
	for (const store of [localStorage, sessionStorage]) {
		for (const key of Object.keys(store)) {
			if (key.startsWith(`${namespace}:`)) {
				store.removeItem(key);
			}
		}
	}
};
