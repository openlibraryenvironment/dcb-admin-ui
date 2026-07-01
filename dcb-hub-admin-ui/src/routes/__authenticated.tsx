import {
	createFileRoute,
	Outlet,
	Navigate,
	useLocation,
} from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { hasAuthParams, useAuth } from "react-oidc-context";
import { useIdleTimer } from "react-idle-timer";

import StructuralLayout from "@layout/StructuralLayout/StructuralLayout";
import Loading from "@components/Loading/Loading";
import Error from "@components/Error/Error";
import { useEffect, useState } from "react";
import Confirmation from "@components/Confirmation/Confirmation";

export const Route = createFileRoute("/__authenticated")({
	component: AuthenticatedLayout,
	errorComponent: ({ error }) => (
		<StructuralLayout>
			<Error
				title="Something went wrong"
				message={error.message}
				action="Reload"
				reload={true}
			/>
		</StructuralLayout>
	),
});

function AuthenticatedLayout() {
	const auth = useAuth();
	const { t } = useTranslation();
	const location = useLocation();
	const [showSessionWarning, setShowSessionWarning] = useState(false);

	const { reset: resetIdleTimer } = useIdleTimer({
		timeout: 1000 * 60 * 15, // 15 minutes total
		promptBeforeIdle: 1000 * 60, // Warn them 1 minute before the timeout hits (at 14 mins)

		onPrompt: () => {
			// Triggered at the 14-minute mark
			setShowSessionWarning(true);
		},
		onActive: () => {
			// UX Bonus: If they come back to their desk and move the mouse/type,
			// this fires automatically and we can hide the modal without them needing to click.
			setShowSessionWarning(false);
		},
		onIdle: () => {
			// Triggered at the 15-minute mark if they ignored the prompt
			setShowSessionWarning(false);
			sessionStorage.clear();
			localStorage.clear();

			auth.signoutRedirect({
				post_logout_redirect_uri: `${window.location.origin}/logout?reason=session_expired`,
			});
		},
		debounce: 500,
	});

	useEffect(() => {
		return auth.events.addAccessTokenExpiring(() => {
			setShowSessionWarning(true);
		});
	}, [auth.events]);

	const handleStayLoggedIn = () => {
		setShowSessionWarning(false);
		resetIdleTimer(); // Reset the physical mouse/keyboard inactivity timer
		auth.signinSilent(); // Renew the Keycloak token in the background
	};

	const handleForceLogout = () => {
		setShowSessionWarning(false);
		auth.signoutRedirect();
	};

	// for auth errors
	if (auth.error) {
		return (
			<StructuralLayout>
				<Error
					title="Authentication Error"
					message={`Oops... ${auth.error.message}`}
					action="Return to Login"
					// Route them back to your clean login/logout flow
					// onClick={() => navigate({ to: "/login", replace: true })}
				/>
			</StructuralLayout>
		);
	}

	if (
		auth.isLoading ||
		auth.activeNavigator === "signinRedirect" ||
		hasAuthParams()
	) {
		return (
			<StructuralLayout>
				<Loading
					title={t("ui.info.loading.document", {
						document_type: t("nav.home").toLowerCase(),
					})}
					subtitle={t("ui.info.wait")}
				/>
			</StructuralLayout>
		);
	}

	if (!auth.isAuthenticated) {
		return (
			<Navigate to="/login" search={{ redirect: location.pathname }} replace />
		);
	}

	return (
		<StructuralLayout>
			<Outlet />
			<Confirmation
				open={showSessionWarning}
				action="sessionWarning"
				customWarningText={t(
					"loginout.expiring_warning",
					"Your session is about to expire. Press continue or move your mouse to stay securely signed in.",
				)}
				onClose={handleForceLogout}
				onConfirm={handleStayLoggedIn}
			/>
		</StructuralLayout>
	);
}

