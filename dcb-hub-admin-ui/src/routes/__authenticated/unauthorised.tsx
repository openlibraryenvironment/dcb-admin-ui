import { createFileRoute } from "@tanstack/react-router";
import Error from "@components/Error/Error";
import { AdminLayout } from "@layout";
//localisation
import { useTranslation } from "react-i18next";

import { capitaliseFirstCharacter } from "src/helpers/capitaliseFirstCharacter";

export const Route = createFileRoute("/__authenticated/unauthorised")({
	component: Unauthorised,
});

function Unauthorised() {
	const { t } = useTranslation();
	return (
		<AdminLayout hideTitleBox={true} hideBreadcrumbs={true}>
			<Error
				title={t("ui.error.401.name")}
				message={t("ui.error.401.summary")}
				description={t("ui.error.401.description")}
				action={capitaliseFirstCharacter(t("ui.error.401.action"))}
			/>
		</AdminLayout>
	);
}
