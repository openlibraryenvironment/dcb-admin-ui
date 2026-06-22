import {
	createFileRoute,
	Outlet,
	Navigate,
	useLocation,
} from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "react-oidc-context";

import StructuralLayout from "@layout/StructuralLayout/StructuralLayout";
import Loading from "@components/Loading/Loading";
import Error from "@components/Error/Error";

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

	if (auth.isLoading) {
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
		</StructuralLayout>
	);
}

