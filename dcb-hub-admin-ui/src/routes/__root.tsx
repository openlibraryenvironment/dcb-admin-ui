import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { AuthContextProps, useAuth } from "react-oidc-context";
import { QueryClient } from "@tanstack/react-query";
import Loading from "@components/Loading/Loading";
import { useTranslation } from "react-i18next";
import { GlobalError, NotFound } from "@components/GlobalErrors/GlobalErrors";

// Define the context available to the router
interface AppRouterContext {
	queryClient: QueryClient;
	auth: AuthContextProps;
	cfg: any;
}

export const Route = createRootRouteWithContext<AppRouterContext>()({
	component: () => {
		// The Outlet will render the correct route.
		// For protected routes, it will be the _authenticated layout.
		// For public routes, it will be the login page directly.
		// This necessitates that authenticated routes MUST be children of the main authenticated route.

		return (
			<>
				<Outlet />
				{process.env.NODE_ENV !== "production" && <TanStackRouterDevtools />}
			</>
		);
	},
	notFoundComponent: NotFound,
	errorComponent: GlobalError,
});
