import {
	createFileRoute,
	Outlet,
	useLocation,
	useNavigate,
} from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { hasAuthParams, useAuth } from "react-oidc-context";
import { useIdleTimer } from "react-idle-timer";

import StructuralLayout from "@layout/StructuralLayout/StructuralLayout";
import Loading from "@components/Loading/Loading";
import Error from "@components/Error/Error";
import { ReactNode, useEffect, useRef, useState } from "react";
import Confirmation from "@components/Confirmation/Confirmation";
import i18n from "@/i18n";
import { appUrl, clearAppStorage, storageKey } from "@helpers/appBase";

export const Route = createFileRoute("/__authenticated")({
	component: AuthenticatedLayout,
	errorComponent: ({ error }) => (
		<StructuralLayout>
			<Error
				title={i18n.t("ui.error.something_wrong")}
				message={error.message}
				action={i18n.t("ui.actions.reload")}
				reload={true}
			/>
		</StructuralLayout>
	),
});

function AuthenticatedLayout() {
	const auth = useAuth();
	const { t } = useTranslation();
	const location = useLocation();
	const navigate = useNavigate();
	const [showSessionWarning, setShowSessionWarning] = useState(false);

	// While a redirect-to-/login navigation is pending, TanStack Router's
	// useLocation() reflects the *target* pathname ("/login") rather than
	// the page that was actually requested, even though this layout is
	// still mounted. Capture the originally-requested path once, before any
	// redirect starts, so the ?redirect= target doesn't get corrupted.
	const originalPathnameRef = useRef(location.pathname);

	const { reset: resetIdleTimer } = useIdleTimer({
		timeout: 1000 * 60 * 30, // 30 minutes total - matches the figure the logout page quotes
		promptBeforeIdle: 1000 * 60, // Warn them 1 minute before the timeout hits (at 29 mins)

		// Idleness is a property of the USER, not of a browser tab. Without
		// crossTab the timers run independently per tab, so a forgotten second tab
		// hit its own idle mark and called signoutRedirect() - which ends the
		// Keycloak SSO session for every tab, yanking the user out of the one they
		// were actively working in. syncTimers rebroadcasts activity so the tabs
		// agree on when the countdown started.
		crossTab: true,
		syncTimers: 1000,
		// Namespaced: sibling OpenRS apps share this origin, and an unnamespaced
		// channel would let one app's idleness drive another's.
		name: storageKey("idle-timer"),

		onPrompt: () => {
			// Triggered at the 29-minute mark, once EVERY tab has gone quiet.
			setShowSessionWarning(true);
		},
		onActive: () => {
			if (showSessionWarning) {
				setShowSessionWarning(false);
				auth.signinSilent().catch(console.error); // Ensure token is fresh when user returns
			}
		},
		onIdle: () => {
			// Triggered at the 30-minute mark if they ignored the prompt.
			// Scoped to this app's keys: a blanket storage.clear() would also wipe
			// the state and OIDC session of any sibling app mounted under another
			// path prefix on the same origin.
			setShowSessionWarning(false);
			clearAppStorage();

			auth.signoutRedirect({
				post_logout_redirect_uri: appUrl("logout?reason=session_expired"),
			});
		},
		debounce: 500,
	});

	const handleStayLoggedIn = () => {
		setShowSessionWarning(false);
		resetIdleTimer(); // Reset the physical mouse/keyboard inactivity timer
		auth.signinSilent(); // Renew the Keycloak token in the background
	};

	const handleForceLogout = () => {
		// Same purge as the idle path below and the Header's logout button. Leaving
		// it out here meant the one route where the user is explicitly told the
		// session is ending was the one that kept their preferences.
		setShowSessionWarning(false);
		clearAppStorage();
		auth.signoutRedirect({
			post_logout_redirect_uri: appUrl("logout?loggedOut=true"),
		});
	};

	const isAuthResolving =
		auth.isLoading ||
		auth.activeNavigator === "signinRedirect" ||
		hasAuthParams();

	// Preserves the original precedence: error and in-flight-auth states
	// must be checked first, since isAuthenticated can be false in both of
	// those cases too.
	const shouldRedirectToLogin =
		!auth.error && !isAuthResolving && !auth.isAuthenticated;

	// Navigating imperatively (rather than rendering a declarative
	// <Navigate>) deliberately: TanStack Router's <Navigate> re-triggers
	// navigate() whenever it receives a new props *object* (see
	// useNavigate.js's previousPropsRef check), and JSX creates a fresh
	// props object every render - which combined with this layout
	// re-rendering as the navigation it just started resolves, caused an
	// infinite render loop. A useEffect keyed on primitive values only
	// re-fires when those values actually change.
	useEffect(() => {
		if (shouldRedirectToLogin) {
			navigate({
				to: "/login",
				search: { redirect: originalPathnameRef.current },
				replace: true,
			});
		}
	}, [shouldRedirectToLogin, navigate]);

	// Nothing to lay out while the effect above sends the user to /login.
	if (shouldRedirectToLogin) {
		return null;
	}

	// Every other branch renders inside a single, stable <StructuralLayout>
	// return site so React keeps the same component instance (and therefore
	// the same mounted Sidebar) across the error/loading/authenticated
	// transitions, instead of remounting it and resetting sidebar state.
	let content: ReactNode;

	if (auth.error) {
		content = (
			<Error
				title="Authentication Error"
				message={t("ui.error.auth_error", { details: auth.error.message })}
				action={t("ui.error.return_to_login")}
				goBack={"/login"}
			/>
		);
	} else if (isAuthResolving) {
		content = (
			<Loading
				title={t("ui.info.loading.document", {
					document_type: t("nav.home").toLowerCase(),
				})}
				subtitle={t("ui.info.wait")}
			/>
		);
	} else {
		content = (
			<>
				<Outlet />
				<Confirmation
					open={showSessionWarning}
					action="sessionWarning"
					customWarningText={t("loginout.expiring_warning")}
					onClose={handleForceLogout}
					onConfirm={handleStayLoggedIn}
				/>
			</>
		);
	}

	return <StructuralLayout>{content}</StructuralLayout>;
}
