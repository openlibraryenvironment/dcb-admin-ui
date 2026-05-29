import * as React from "react";
import * as ReactDOM from "react-dom/client";
import { createRouter } from "@tanstack/react-router";
import { AuthProvider } from "react-oidc-context";
import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { User } from "oidc-client-ts";
import { LicenseInfo } from "@mui/x-license";

import "./i18n";
import { routeTree } from "./routeTree.gen";
import theme from "@themes/openrs.ts"; // Sort this out, it's a mess
import App from "@components/App/App";

// Do we still want these?
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";

// 1. Tell TypeScript about the Cloudflare-injected window variable
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

// 2. Optimized Config Fetching (Zero Waterfall)
async function getCfg() {
	try {
		// A. Cloudflare HTMLRewriter injection (Instant)
		if (typeof window !== "undefined" && window.__APP_ENV__) {
			return window.__APP_ENV__;
		}

		// B. Fallback for local Vite dev (npm run dev)
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

// 3. Declare router variable so the QueryClient can use it for redirects
let router: ReturnType<typeof createRouter>;

// 4. SPA-Native Error Handling
const handleServiceErrors = (error: any) => {
	const isNetworkError =
		error.message?.includes("Failed to fetch") ||
		error.message?.includes("Network request failed") ||
		error.message?.includes("NetworkError");
	const isServiceUnavailable = error?.response?.status === 503;

	if (window.location.pathname === "/maintenance") {
		return;
	}

	// Use TanStack Router for instant transitions instead of hard reloading
	if (isServiceUnavailable && router) {
		router.navigate({ to: "/maintenance", replace: true });
	} else if (isNetworkError && router) {
		router.navigate({ to: "/networkError", replace: true });
	}
};

// 5. Setup TanStack Query
const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 1000 * 60 * 5, // 5 minutes
			retry: 1,
		},
	},
	queryCache: new QueryCache({
		onError: handleServiceErrors,
	}),
	mutationCache: new MutationCache({
		onError: handleServiceErrors,
	}),
});

// 6. Application Bootstrapper
async function bootstrap() {
	const cfg = await getCfg();

	// Set MUI License
	if (cfg.VITE_MUI_X_LICENSE_KEY) {
		LicenseInfo.setLicenseKey(cfg.VITE_MUI_X_LICENSE_KEY);
	}

	// Instantiate Router
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

	// Setup OIDC Configuration
	const oidcConfig = {
		authority: cfg.VITE_KEYCLOAK_URL,
		client_id: cfg.VITE_KEYCLOAK_ID,
		redirect_uri: window.location.origin,
		response_type: "code",
		scope: "openid profile email",
		loadUserInfo: true,
		automaticSilentRenew: true,
		onSigninCallback: (_user: User | void): void => {
			console.log("Sign in for ", _user);
			const isReadOnly = _user?.profile?.roles?.includes("LIBRARY_READ_ONLY");
			const afterLoginRedirectPath = sessionStorage.getItem(
				"afterLoginRedirectPath",
			);

			// Clear the OIDC code from the URL cleanly
			window.history.replaceState({}, document.title, window.location.pathname);

			// SPA-Native redirects
			if (isReadOnly) {
				router.navigate({ to: "/requesting", replace: true });
				return;
			}

			if (afterLoginRedirectPath) {
				sessionStorage.removeItem("afterLoginRedirectPath");
				router.navigate({ to: afterLoginRedirectPath, replace: true });
			}
		},
	};

	// Mount the Application
	const rootElement = document.getElementById("root")!;
	if (!rootElement.innerHTML) {
		const root = ReactDOM.createRoot(rootElement);
		root.render(
			<React.StrictMode>
				<AuthProvider {...oidcConfig}>
					<App theme={theme} queryClient={queryClient} router={router} />
				</AuthProvider>
			</React.StrictMode>,
		);
	}
}

// 7. Register router for TanStack Router Type Safety
declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}

bootstrap();
