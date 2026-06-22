import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import PageContainer from "@layout/PageContainer/PageContainer";
import ErrorComponent from "@components/Error/Error";
import { capitaliseFirstCharacter } from "@helpers/capitaliseFirstCharacter";

export const Route = createFileRoute("/__authenticated/unauthorised")({
	component: Unauthorised,
});

function Unauthorised() {
	const { t } = useTranslation();

	return (
		<PageContainer hideTitleBox={true} hideBreadcrumbs={true}>
			<ErrorComponent
				title={t("ui.error.401.name")}
				message={t("ui.error.401.summary")}
				description={t("ui.error.401.description")}
				action={capitaliseFirstCharacter(t("ui.error.401.action"))}
				goBack="/"
			/>
		</PageContainer>
	);
}
