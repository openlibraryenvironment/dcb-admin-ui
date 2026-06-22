import { useTranslation } from "react-i18next";
import { ErrorComponentProps } from "@tanstack/react-router";
import PageContainer from "@layout/PageContainer/PageContainer";
import Error from "@components/Error/Error";
import { capitaliseFirstCharacter } from "@helpers/capitaliseFirstCharacter";

export function NotFound() {
	const { t } = useTranslation();
	return (
		<PageContainer title={t("404.page_title")} hideTitleBox hideBreadcrumbs>
			<Error
				title={t("ui.error.404.name")}
				message={t("ui.error.404.summary")}
				description={t("ui.error.404.description")}
				action={capitaliseFirstCharacter(t("ui.error.404.action"))}
				goBack="/"
			/>
		</PageContainer>
	);
}

export function GlobalError({ error }: ErrorComponentProps) {
	const { t } = useTranslation();
	console.error("Global crash caught by TanStack:", error);

	return (
		<PageContainer hideBreadcrumbs>
			<Error
				title={t("ui.error.500.name")}
				message={t("ui.error.500.summary")}
				description={t("ui.error.500.description")}
				action={t("ui.error.500.action")}
				goBack="/"
			/>
		</PageContainer>
	);
}
