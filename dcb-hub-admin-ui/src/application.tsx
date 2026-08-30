import * as React from "react";
import * as ReactDOM from "react-dom/client";
import { createRouter, AnyRouter } from "@tanstack/react-router";
import { AuthProvider } from "react-oidc-context";
import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { User, UserManager, WebStorageStateStore } from "oidc-client-ts";
import { LicenseInfo } from "@mui/x-license";

import "./i18n";
import { routeTree } from "./routeTree.gen";
import App from "@components/App/App";
import {
	appUrl,
	clearAppStorage,
	getAppBase,
	postLoginRedirectKey,
	toInternalPath,
	toRoutePath,
} from "@helpers/appBase";

// The @font-face rules moved to `src/themes/fonts.ts`, which is the registry the picker
// and the theme both read. Two places declaring the same faces is how one of them ends up
// shipping a family nothing selects.

declare global {
	interface Window {
		__APP_ENV__?: {
			VITE_MUI_X_LICENSE_KEY: string;
			VITE_KEYCLOAK_URL: string;
			VITE_KEYCLOAK_ID: string;
			VITE_DCB_API_BASE: string;
			VITE_DCB_SEARCH_BASE: string;
			VITE_ILL_API_BASE?: string;
			[key: string]: string | undefined;
		};
		__DCB_BUNDLE_BASE_URL__?: string;
	}
}

export async function getStandaloneConfig() {
	try {
		if (typeof window !== "undefined" && window.__APP_ENV__) {
			return window.__APP_ENV__;
		}

		// Base-scoped, not "/inject_env.json": the origin may host several apps
		// under path prefixes, and a root-relative fetch gives the server no way
		// to tell which of them is asking.
		const response = await fetch(`${getAppBase()}inject_env.json`, {
			cache: "no-store",
		});

		if (
			!response.ok ||
			response.headers.get("Content-Type")?.includes("text/html")
		) {
			return {
				VITE_MUI_X_LICENSE_KEY: String(import.meta.env.VITE_MUI_X_LICENSE_KEY),
				VITE_KEYCLOAK_URL: String(import.meta.env.VITE_KEYCLOAK_URL),
				VITE_KEYCLOAK_ID: String(import.meta.env.VITE_KEYCLOAK_ID),
				VITE_DCB_API_BASE: String(import.meta.env.VITE_DCB_API_BASE),
				VITE_DCB_SEARCH_BASE: String(import.meta.env.VITE_DCB_SEARCH_BASE),
				VITE_ILL_API_BASE: String(import.meta.env.VITE_ILL_API_BASE),
			};
		}

		return await response.json();
	} catch (err) {
		console.warn("Could not load config, falling back to Vite defaults:", err);
		return {};
	}
}

let router: AnyRouter;
// Assigned in mountDcbAdmin(), before anything that can produce a 401 exists.
let userManager!: UserManager;

/**
 * Ends the session for real and lands the user on /logout with an explanation.
 *
 * removeUser() rather than a hand-built localStorage key: the key format is an
 * oidc-client-ts implementation detail (and silently mismatches if the authority
 * carries a trailing slash), and deleting it behind the UserManager's back left
 * the in-memory react-oidc-context state still reporting isAuthenticated: true.
 */
const endSession = async (routePath: string) => {
	queryClient.clear();
	await userManager.removeUser().catch(() => undefined);
	clearAppStorage();

	// A full document load, not router.navigate(). This is the one logout path
	// that never leaves the SPA, so a client-side navigation would leave every
	// Zustand store alive in memory with the values just deleted from storage -
	// and persist middleware writes them straight back on the next set(). The
	// hard load is also what the other logout paths get for free by bouncing
	// through Keycloak.
	const search = new URLSearchParams({ reason: "session_expired" });
	if (routePath) {
		search.set("redirect", routePath);
	}
	window.location.assign(appUrl(`logout?${search.toString()}`));
};

// A single in-flight recovery, shared by every caller. A page fires many queries
// at once, so one expired access token surfaces as a burst of 401s; without this
// each of them would kick off its own renewal and its own navigation.
let sessionRecovery: Promise<boolean> | null = null;

const recoverSession = (): Promise<boolean> => {
	sessionRecovery ??= userManager
		.signinSilent()
		.then((user) => !!user)
		.catch(() => false)
		.finally(() => {
			sessionRecovery = null;
		});
	return sessionRecovery;
};

const handleServiceErrors = (error: any) => {
	const isNetworkError =
		error.message?.includes("Failed to fetch") ||
		error.message?.includes("Network request failed") ||
		error.message?.includes("NetworkError");
	const isServiceUnavailable = error?.response?.status === 503;
	const isUnauthorized = error?.response?.status === 401;

	// Router paths, so these comparisons still hold when the app is mounted under
	// a base path (window.location.pathname would be "/dcb-admin/logout").
	const routePath = toRoutePath();

	if (
		routePath === "/maintenance" ||
		routePath === "/login" ||
		routePath === "/logout" || // Add this to prevent loops
		routePath === "/networkError"
	) {
		return;
	}

	if (isUnauthorized && router) {
		// A 401 is not proof the session is over - the overwhelmingly common cause
		// is an access token that aged out between renewals. Spend one silent
		// renewal on it (Keycloak issues a refresh token for the code flow, so this
		// is a plain token request, no iframe) and only tear the session down if
		// that genuinely fails. Previously every 401 was an immediate hard logout,
		// which is what threw users out mid-session.
		void recoverSession().then((renewed) => {
			if (!renewed) {
				void endSession(routePath);
				return;
			}
			// Deferred a tick on purpose. A query's queryFn is a closure over the
			// GraphQL/REST client built from the token that was current when the
			// component last rendered. signinSilent() resolving only dispatches the
			// new user into react-oidc-context; refetching in this same microtask
			// would re-run the old closures with the token that just 401'd. The
			// timeout lets React flush that render, so useGraphQLClient's memo
			// (keyed on access_token) has produced a client carrying the new one.
			setTimeout(() => void queryClient.refetchQueries({ type: "active" }), 0);
		});
	} else if (isServiceUnavailable && router) {
		router.navigate({ to: "/maintenance", replace: true });
	} else if (isNetworkError && router) {
		router.navigate({ to: "/networkError", replace: true });
	}
};

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 1000 * 60 * 5, // 5 minutes
			retry: 1,
			throwOnError: (error: any) => {
				// Don't throw 401s/503s to the UI boundary, let the cache handler deal with those
				const status = error?.response?.status;
				return status !== 401 && status !== 503;
			},
		},
	},
	queryCache: new QueryCache({
		onError: handleServiceErrors,
	}),
	mutationCache: new MutationCache({
		onError: handleServiceErrors,
	}),
});

export async function mountDcbAdmin(
	rootElement: HTMLElement,
	cfg: Record<string, string | undefined>,
): Promise<void> {
	// Publish the resolved runtime config so non-React modules can read it too
	// (homeConfig.ts). Without this, window.__APP_ENV__ is never populated - the
	// image renders inject_env.json and getStandaloneConfig() fetches it, so those
	// modules fell back to import.meta.env, which .dockerignore leaves undefined in
	// the build.
	window.__APP_ENV__ = cfg as Window["__APP_ENV__"];

	if (cfg.VITE_MUI_X_LICENSE_KEY) {
		LicenseInfo.setLicenseKey(cfg.VITE_MUI_X_LICENSE_KEY);
	}

	router = createRouter({
		routeTree,
		// Startup constant, never tenant config. Standalone uses its asset base;
		// the bootloader adapter routes at the host root.
		basepath: getAppBase(),
		defaultPreload: "intent",
		defaultPreloadStaleTime: 0,
		defaultStaleTime: 5000,
		scrollRestoration: true,
		context: {
			cfg, // Injected config
			auth: undefined!, // Will be provided by OIDC at the component level
			queryClient, // Injected React Query
		},
	});

	userManager = new UserManager({
		authority: cfg.VITE_KEYCLOAK_URL!,
		client_id: cfg.VITE_KEYCLOAK_ID!,
		// The app's own base, not the bare origin: where several apps are mounted
		// under path prefixes, the origin root serves none of them.
		redirect_uri: appUrl(),
		post_logout_redirect_uri: appUrl(),
		// A bare static page, NOT the app. silent_redirect_uri defaults to
		// redirect_uri, which pointed the hidden renewal iframe at the whole SPA:
		// the entire admin UI had to boot inside it and answer within
		// silentRequestTimeoutInSeconds (10s) or the renewal "failed".
		silent_redirect_uri: appUrl("silent-renew.html"),
		response_type: "code",
		scope: "openid profile email",
		loadUserInfo: true,
		automaticSilentRenew: true,
		// monitorSession is deliberately OFF (the oidc-client-ts default).
		// It polls Keycloak's check-session iframe every 2s; that iframe is
		// cross-site, so any browser partitioning third-party cookies (Safari and
		// Firefox always, Chrome increasingly) cannot see the Keycloak session
		// cookie and reports "changed". SessionMonitor answers that by calling
		// querySessionStatus(), and ANY failure there raises userSignedOut, which
		// react-oidc-context turns into isAuthenticated: false. That is a silent,
		// unrecoverable logout of a user whose session is perfectly valid.

		// `revokeAccessTokenOnSignout` was the oidc-client-ts v2 name; v3 renamed it
		// to this. The old key sat in an untyped object literal spread into
		// <AuthProvider>, so TypeScript never caught it and revocation on sign-out
		// had quietly been off since the v3 upgrade.
		revokeTokensOnSignout: true,
		userStore: new WebStorageStateStore({ store: window.localStorage }),
	});

	// The real silent-renew failure hook. The previous `onSilentRenewError` key on
	// the config object was dead code: it is neither an AuthProvider prop nor a
	// UserManagerSettings field, so oidc-client-ts dropped it and nothing ever
	// observed a failed renewal. Spreading an untyped object into <AuthProvider>
	// meant TypeScript never flagged it either.
	userManager.events.addSilentRenewError((error: Error) => {
		console.warn("Silent renew failed", error);
		// Don't sign the user out on the strength of one failed renewal - a network
		// blip or a Keycloak restart hits this too. The access token is still valid
		// until it expires; if the session really is gone the next 401 ends it.
		void recoverSession();
	});

	const oidcConfig = {
		userManager,
		onSigninCallback: (_user: User | void): void => {
			const isReadOnly = _user?.profile?.roles?.includes("LIBRARY_READ_ONLY");
			const postLoginRedirectPath = sessionStorage.getItem(
				postLoginRedirectKey(),
			);

			// Clear the OIDC code from the URL cleanly
			window.history.replaceState({}, document.title, window.location.pathname);

			// SPA-Native redirects
			if (isReadOnly) {
				router.navigate({ to: "/search", replace: true });
				return;
			}

			// Re-validated at the sink, not just where it was stored. This value
			// originates in an attacker-suppliable ?redirect= param and has since
			// been through sessionStorage, which any same-origin script can write.
			const safeRedirect = toInternalPath(postLoginRedirectPath ?? undefined);
			if (postLoginRedirectPath) {
				sessionStorage.removeItem(postLoginRedirectKey());
			}
			if (safeRedirect) {
				router.navigate({ to: safeRedirect, replace: true });
			}
		},
	};

	if (!rootElement.innerHTML) {
		const root = ReactDOM.createRoot(rootElement);
		root.render(
			<React.StrictMode>
				<AuthProvider {...oidcConfig}>
					<App queryClient={queryClient} router={router} />
				</AuthProvider>
			</React.StrictMode>,
		);
	}
}

declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}
