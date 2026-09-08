/**
 * Base-path awareness for deployments that mount several OpenRS apps at path
 * prefixes on ONE origin (mobius.kihosting.net/dcb-admin,
 * mobius.kihosting.net/dcb-admin-for-libraries, ...).
 *
 * Standalone startup uses Vite's asset base. KI bootloader startup uses "/"
 * because its assets resolve relative to ki-bootstrap.js independently. The
 * base is therefore RUNTIME state, set once at startup by configureAppBase()
 * before the app mounts - not a build-time constant. Everything derived from it
 * (namespaces, redirect keys, absolute URLs) must be read through the accessors
 * below, never captured into a module-load constant, or embedded mode reads the
 * standalone base that was current at import time.
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
export const getAppNamespace = (): string =>
	appBase.replace(/^\/|\/$/g, "") || "root";

/**
 * Namespaces a persisted-store key. Sibling apps on the same origin share one
 * localStorage and one sessionStorage, so a bare key like "grid-storage"
 * collides: last writer wins, and hydrating a sibling's differently-shaped
 * state can throw during render.
 */
export const storageKey = (name: string) => `${getAppNamespace()}:${name}`;

/**
 * Where the "send me back here once login completes" path is parked across the
 * OIDC round trip, written by the login/logout pages and read by the signin
 * callback in application.tsx.
 *
 * A function rather than a constant, and namespaced like every other key:
 * sessionStorage is shared by every OpenRS app on the origin, so an
 * unnamespaced "postLoginRedirectPath" is a name two apps can both claim - and
 * the loser sends its user to a path that only exists in the other app. It
 * MUST be resolved at call time: the namespace depends on the runtime base,
 * which configureAppBase() only fixes after this module is imported (embedded
 * mode sets it to "/"), so a captured constant would carry the standalone
 * namespace into an embedded mount.
 *
 * Deliberately NOT exempt from the sign-out purge. It is transient, and no
 * purge runs between the write and the read: the logout page purges on mount,
 * before the user can click through to sign in.
 */
export const postLoginRedirectKey = (): string =>
	storageKey("postLoginRedirectPath");

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
 * Narrows an attacker-controllable "come back here afterwards" value to a path
 * inside this app, or to nothing.
 *
 * The ?redirect= search param is carried through the login round trip and ends
 * up in router.navigate({ to }). Unvalidated, that is OWASP's classic
 * unvalidated redirect/forward: a link to /login?redirect=//evil.example sends
 * a user who has just authenticated straight off-origin, carrying the
 * credibility of having started on a page they trust.
 */
export const toInternalPath = (
	value: string | undefined,
): string | undefined => {
	if (typeof value !== "string") return undefined;

	// Rooted at exactly one slash. Rules out "//host" (protocol-relative) and
	// "/\host" (which several browsers normalise to "//host"), and with them
	// every scheme-bearing value, since those cannot start with a slash.
	if (!/^\/(?![/\\])/.test(value)) return undefined;

	// Reject space, the C0 control characters and DEL. Browsers strip or
	// normalise several of these while parsing a URL, so a value that looks
	// inert on inspection can parse into something else once navigated to.
	for (let i = 0; i < value.length; i++) {
		const code = value.charCodeAt(i);
		if (code <= 0x20 || code === 0x7f) return undefined;
	}

	return value;
};

/**
 * Namespaced key suffixes that survive the sign-out purge.
 *
 * The bar is deliberately high: a suffix belongs here only if it holds no
 * user-specific state at all. Anything a user chose, typed, or filtered by is
 * account state that happens to be sitting in the browser until the
 * user-preferences API exists, and it goes.
 *
 * Stored as bare suffixes, not fully-qualified keys, because the namespace is
 * runtime state (see getAppNamespace) - the full key is rebuilt at purge time.
 */
const SIGN_OUT_EXEMPT_SUFFIXES = new Set<string>([
	// Consortium branding (display name, header image, catalogue URL). Public,
	// non-personal, and identical for every user of the deployment - so purging
	// it discloses nothing and costs something: the logout page renders
	// "Your DCB Admin for {consortium} session has ended", and without this the
	// branded name degrades to the store's generic default on the one screen
	// where a user is most likely to be looking at it.
	//
	// Note this is cached SERVER data, not a preference. Service-version state
	// (dcb-version-storage) is the same category but is NOT exempt: nothing
	// renders it on the signed-out screens, so it can be refetched on next login.
	"consortium-storage",
]);

/**
 * The sign-out purge: drops every persisted store this app owns, across BOTH
 * web storages (grid and service-info state live in sessionStorage, theme,
 * sidebar, cost and consortium state in localStorage).
 *
 * Until preferences move server-side behind a user-preferences API, everything
 * here is browser-scoped rather than account-scoped, so it outlives the session
 * that created it. On the shared workstations this app runs on that is a
 * disclosure problem, not just an untidy one: saved grid filters can carry
 * patron request identifiers and search terms from the previous user.
 *
 * Everything the app owns goes, except SIGN_OUT_EXEMPT_SUFFIXES above.
 *
 * MUST be called before a full page load, not alongside a client-side
 * navigation: Zustand's persist middleware writes on every set(), so a store
 * still live in memory will happily repopulate the key this just deleted.
 *
 * A blanket storage.clear() is deliberately not used - it would also destroy the
 * state of any sibling OpenRS app mounted under another path prefix on this
 * origin. OIDC's own keys are likewise left alone: they are keyed by authority +
 * client_id, and removeUser()/signoutRedirect() are what retire those.
 */
export const clearAppStorage = (): void => {
	const prefix = `${getAppNamespace()}:`;
	const exempt = new Set(
		[...SIGN_OUT_EXEMPT_SUFFIXES].map((suffix) => `${prefix}${suffix}`),
	);
	for (const store of [localStorage, sessionStorage]) {
		for (const key of Object.keys(store)) {
			if (key.startsWith(prefix) && !exempt.has(key)) {
				store.removeItem(key);
			}
		}
	}
};
