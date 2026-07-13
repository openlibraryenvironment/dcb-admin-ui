import * as React from "react";
import * as ReactDOM from "react-dom/client";
import { createRouter, AnyRouter } from "@tanstack/react-router";
import { AuthProvider } from "react-oidc-context";
import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { User, WebStorageStateStore } from "oidc-client-ts";
import { LicenseInfo } from "@mui/x-license";

import "./i18n";
import { routeTree } from "./routeTree.gen";
import App from "@components/App/App";

// Do we still want these?
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";

declare global {
	interface Window {
		__APP_ENV__?: {
			VITE_MUI_X_LICENSE_KEY: string;
			VITE_KEYCLOAK_URL: string;
			VITE_KEYCLOAK_ID: string;
			VITE_DCB_API_BASE: string;
			VITE_DCB_SEARCH_BASE: string;
			VITE_ILL_API_BASE?: string;
			VITE_PUBLIC_URL: string;
			[key: string]: string | undefined;
		};
	}
}

async function getCfg() {
	try {
		if (typeof window !== "undefined" && window.__APP_ENV__) {
			return window.__APP_ENV__;
		}

		const response = await fetch("/inject_env.json", { cache: "no-store" });

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
				VITE_PUBLIC_URL: String(import.meta.env.VITE_PUBLIC_URL || "/"),
			};
		}

		return await response.json();
	} catch (err) {
		console.warn("Could not load config, falling back to Vite defaults:", err);
		return {
			VITE_PUBLIC_URL: "/",
		};
	}
}

let router: AnyRouter;

const handleServiceErrors = (error: any) => {
	const isNetworkError =
		error.message?.includes("Failed to fetch") ||
		error.message?.includes("Network request failed") ||
		error.message?.includes("NetworkError");
	const isServiceUnavailable = error?.response?.status === 503;
	const isUnauthorized = error?.response?.status === 401;

	if (
		window.location.pathname === "/maintenance" ||
		window.location.pathname === "/login" ||
		window.location.pathname === "/logout" // Add this to prevent loops
	) {
		return;
	}

	if (isUnauthorized && router) {
		queryClient.clear();
		// Remove local user data so react-oidc-context knows they are gone.
		// Must match the WebStorageStateStore backing store below (localStorage), not sessionStorage.
		const { cfg } = router.options.context as { cfg: any };
		localStorage.removeItem(
			`oidc.user:${cfg.VITE_KEYCLOAK_URL}:${cfg.VITE_KEYCLOAK_ID}`,
		);

		// Push them to logout instead of login
		router.navigate({
			to: "/logout",
			search: { reason: "session_expired", redirect: window.location.pathname },
			replace: true,
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

async function bootstrap() {
	const cfg = await getCfg();

	// Publish the resolved runtime config so non-React modules can read it too
	// (homeConfig.ts). Without this, window.__APP_ENV__ is never populated - the
	// image renders inject_env.json and getCfg() fetches it, so those modules fell
	// back to import.meta.env, which .dockerignore leaves undefined in the build.
	window.__APP_ENV__ = cfg as Window["__APP_ENV__"];

	if (cfg.VITE_MUI_X_LICENSE_KEY) {
		LicenseInfo.setLicenseKey(cfg.VITE_MUI_X_LICENSE_KEY);
	}

	router = createRouter({
		routeTree,
		basepath: cfg.VITE_PUBLIC_URL || "/",
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

	const oidcConfig = {
		authority: cfg.VITE_KEYCLOAK_URL,
		client_id: cfg.VITE_KEYCLOAK_ID,
		redirect_uri: window.location.origin,
		response_type: "code",
		scope: "openid profile email",
		loadUserInfo: true,
		automaticSilentRenew: true,
		monitorSession: true,
		revokeAccessTokenOnSignout: true,
		userStore: new WebStorageStateStore({ store: window.localStorage }),
		onSilentRenewError: (error: Error) => {
			console.warn("Silent renew failed, user session expired", error);

			queryClient.clear();
			router.navigate({
				to: "/logout",
				search: { reason: "session_expired" },
				replace: true,
			});
		},
		onSigninCallback: (_user: User | void): void => {
			const isReadOnly = _user?.profile?.roles?.includes("LIBRARY_READ_ONLY");
			const postLoginRedirectPath = sessionStorage.getItem(
				"postLoginRedirectPath",
			);

			// Clear the OIDC code from the URL cleanly
			window.history.replaceState({}, document.title, window.location.pathname);

			// SPA-Native redirects
			if (isReadOnly) {
				router.navigate({ to: "/requesting", replace: true });
				return;
			}

			if (postLoginRedirectPath) {
				sessionStorage.removeItem("postLoginRedirectPath");
				router.navigate({ to: postLoginRedirectPath, replace: true });
			}
		},
	};

	const rootElement = document.getElementById("root")!;
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

bootstrap();
declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}
