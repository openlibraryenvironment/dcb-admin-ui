import { createFileRoute } from "@tanstack/react-router";
import Error from "@components/Error/Error";
import { AdminLayout } from "@layout";
import { useTranslation } from "react-i18next";

import { capitaliseFirstCharacter } from "@helpers/capitaliseFirstCharacter";

export const Route = createFileRoute("/404")({
	component: NotFound,
});

function NotFound() {
	const { t } = useTranslation();
	return (
		<AdminLayout
			title={t("404.page_title")}
			hideTitleBox={true}
			hideBreadcrumbs={true}
		>
			<Error
				title={t("ui.error.404.name")}
				message={t("ui.error.404.summary")}
				description={t("ui.error.404.description")}
				action={capitaliseFirstCharacter(t("ui.error.404.action"))}
				goBack="/"
			/>
		</AdminLayout>
	);
}
