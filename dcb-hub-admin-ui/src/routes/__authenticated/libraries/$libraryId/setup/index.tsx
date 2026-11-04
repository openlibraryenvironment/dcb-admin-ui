import { Navigate, createFileRoute, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@mui/material";
import { useTranslation } from "react-i18next";

import PageContainer from "@layout/PageContainer/PageContainer";
import Error from "@components/Error/Error";
import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { libraryQuery } from "@/queryOptions/library";
import { librarySetupCountsQuery } from "@/queryOptions/librarySetup";
import { isLibrarySetupStepId } from "@helpers/librarySetupFlow";
import { libraryFlowState } from "@helpers/librarySetup";
import i18n from "@/i18n";
import { errorForDisplay } from "@helpers/safeErrorLog";

/** A library's setup, opened without a chapter: the first one still outstanding. */
export const Route = createFileRoute(
	"/__authenticated/libraries/$libraryId/setup/",
)({
	errorComponent: ({ error }) => (
		<PageContainer hideTitleBox hideBreadcrumbs>
			<Error
				title={i18n.t("ui.error.unable_to_load_page")}
				message={errorForDisplay(error)}
				action={i18n.t("ui.actions.reload")}
				onAction={() => location.reload()}
			/>
		</PageContainer>
	),
	pendingComponent: () => (
		<PageContainer hideTitleBox hideBreadcrumbs>
			<Skeleton variant="rounded" height={480} />
		</PageContainer>
	),
	component: LibrarySetupStart,
});

function LibrarySetupStart() {
	const { t } = useTranslation();
	const { libraryId } = useParams({
		from: "/__authenticated/libraries/$libraryId/setup/",
	});
	const gqlClient = useGraphQLClient();
	const library = useQuery(libraryQuery(gqlClient, libraryId));
	const counts = useQuery(librarySetupCountsQuery(gqlClient, library.data));

	if (library.isError) {
		return (
			<PageContainer hideTitleBox hideBreadcrumbs>
				<Error
					title={t("libraries.setup.error_title")}
					message={t("libraries.setup.error_body")}
					action={t("ui.actions.reload")}
					onAction={() => location.reload()}
				/>
			</PageContainer>
		);
	}
	if (library.isPending || counts.isPending) {
		return (
			<PageContainer hideTitleBox hideBreadcrumbs>
				<Skeleton variant="rounded" height={480} />
			</PageContainer>
		);
	}

	const first = libraryFlowState(
		library.data,
		counts.data ?? {},
	).firstIncompleteStep;
	return first && isLibrarySetupStepId(first) ? (
		<Navigate
			to="/libraries/$libraryId/setup/$step"
			params={{ libraryId, step: first }}
			replace
		/>
	) : (
		<Navigate
			to="/libraries/$libraryId/setup/done"
			params={{ libraryId }}
			replace
		/>
	);
}
