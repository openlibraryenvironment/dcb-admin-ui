/**
 * Base-path awareness for deployments that mount several OpenRS apps at path
 * prefixes on ONE origin (mobius.kihosting.net/dcb-admin,
 * mobius.kihosting.net/dcb-admin-for-libraries, ...).
 *
 * BASE is baked in at build time by Vite (`base` in vite.config.mts, fed from
 * VITE_PUBLIC_URL). It is deliberately NOT runtime config: the asset base and
 * the router basepath must be the same value, and only the build can know the
 * asset base. Supplying it a second time via inject_env.json let the two drift
 * apart, which mounted the router at a path its own assets didn't resolve from.
 */

// Vite normalises this to always carry a trailing slash: "/" or "/dcb-admin/".
export const BASE = import.meta.env.BASE_URL;

/**
 * Identifies this app within the storage shared by every app on the origin.
 * "/dcb-admin/" -> "dcb-admin"; "/" -> "root".
 */
export const APP_NAMESPACE = BASE.replace(/^\/|\/$/g, "") || "root";

/**
 * Namespaces a persisted-store key. Sibling apps on the same origin share one
 * localStorage and one sessionStorage, so a bare key like "grid-storage"
 * collides: last writer wins, and hydrating a sibling's differently-shaped
 * state can throw during render.
 */
export const storageKey = (name: string) => `${APP_NAMESPACE}:${name}`;

/**
 * Absolute URL to a path inside this app - for anything handed to an external
 * system (OIDC redirect_uri, post_logout_redirect_uri). window.location.origin
 * alone points at the bare host, which serves no app when several are mounted
 * under prefixes.
 */
export const appUrl = (path = ""): string =>
	`${window.location.origin}${BASE}${path.replace(/^\//, "")}`;

/**
 * Strips the base off a browser pathname to give a router path. TanStack Router
 * works in basepath-relative paths, but window.location.pathname includes the
 * base, so the two must never be compared or interchanged raw.
 */
export const toRoutePath = (
	pathname: string = window.location.pathname,
): string => {
	const prefix = BASE.slice(0, -1); // "" when BASE is "/"
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
	for (const store of [localStorage, sessionStorage]) {
		for (const key of Object.keys(store)) {
			if (key.startsWith(`${APP_NAMESPACE}:`)) {
				store.removeItem(key);
			}
		}
	}
};
