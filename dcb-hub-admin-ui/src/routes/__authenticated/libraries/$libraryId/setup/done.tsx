import { createFileRoute, redirect, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
	Alert,
	List,
	ListItem,
	ListItemIcon,
	ListItemText,
	Skeleton,
	Stack,
	Typography,
} from "@mui/material";
import { CheckCircle, RadioButtonUnchecked } from "@mui/icons-material";
import { useTranslation } from "react-i18next";

import PageContainer from "@layout/PageContainer/PageContainer";
import Error from "@components/Error/Error";
import {
	CustomLink,
	CustomLinkButton,
} from "@components/CustomLink/CustomLink";
import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { useIsConsortiumAdmin } from "@hooks/useIsConsortiumAdmin";
import {
	fetchLibrary,
	libraryQuery,
	libraryQueryKey,
} from "@/queryOptions/library";
import {
	libraryHarvestQuery,
	librarySetupCountsQuery,
} from "@/queryOptions/librarySetup";
import { createGraphQLClient } from "@helpers/createGraphQLClient";
import {
	evaluateLibraryIngest,
	ingestMessageKey,
	libraryFlowState,
} from "@helpers/librarySetup";
import { isLibrarySetupStepId } from "@helpers/librarySetupFlow";
import { adminOrConsortiumAdmin } from "@constants/roles";
import i18n from "@/i18n";
import { errorForDisplay } from "@helpers/safeErrorLog";

const FROM = "/__authenticated/libraries/$libraryId/setup/done";

export const Route = createFileRoute(
	"/__authenticated/libraries/$libraryId/setup/done",
)({
	beforeLoad: ({ context: { auth } }) => {
		if (!auth?.isAuthenticated) return;
		const roles = (auth.user?.profile?.roles as string[]) || [];
		if (!roles.some((role) => adminOrConsortiumAdmin.includes(role))) {
			throw redirect({ to: "/unauthorised" });
		}
	},
	loader: ({ context: { queryClient, cfg, auth }, params: { libraryId } }) => {
		if (!auth?.isAuthenticated) return;
		return queryClient.ensureQueryData({
			queryKey: libraryQueryKey(libraryId),
			queryFn: () => fetchLibrary(createGraphQLClient(cfg, auth), libraryId),
		});
	},
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
	pendingComponent: () => <DoneSkeleton />,
	component: LibrarySetupDone,
});

function DoneSkeleton() {
	return (
		<PageContainer hideTitleBox hideBreadcrumbs>
			<Stack spacing={3} sx={{ maxWidth: 780 }}>
				<Skeleton variant="text" width="60%" height={48} />
				<Skeleton variant="rounded" height={420} />
			</Stack>
		</PageContainer>
	);
}

/**
 * What is actually done, not a celebration. Every chapter links back to itself, and the
 * harvest is checked, because a library with no records cannot supply anything.
 */
function LibrarySetupDone() {
	const { t } = useTranslation();
	const { libraryId } = useParams({ from: FROM });
	const gqlClient = useGraphQLClient();
	const isAdmin = useIsConsortiumAdmin();

	const {
		data: library,
		isPending,
		isError,
	} = useQuery(libraryQuery(gqlClient, libraryId));
	const counts = useQuery(librarySetupCountsQuery(gqlClient, library));
	const harvest = useQuery(
		libraryHarvestQuery(gqlClient, library?.agency?.hostLms?.id),
	);

	if (!isAdmin) {
		return (
			<PageContainer hideTitleBox hideBreadcrumbs>
				<Error
					title={t("ui.error.401.name")}
					message={t("ui.error.401.summary")}
					description={t("ui.error.401.description")}
					action={t("ui.error.401.action")}
					goBack="/"
				/>
			</PageContainer>
		);
	}
	if (isPending || (library && counts.isPending)) return <DoneSkeleton />;
	if (isError || !library) {
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

	const state = libraryFlowState(library, counts.data ?? {});
	const steps = state.steps.filter((step) => isLibrarySetupStepId(step.id));
	const complete = steps.every((step) => step.complete);
	const ingest = harvest.data
		? evaluateLibraryIngest(harvest.data, library)
		: undefined;

	return (
		<PageContainer
			title={t("libraries.setup.done.page_title")}
			hideTitleBox
			hideBreadcrumbs
		>
			<Stack spacing={3} sx={{ maxWidth: 780 }}>
				<Typography variant="h1" component="h1">
					{complete
						? t("libraries.setup.done.title", { library: library.fullName })
						: t("libraries.setup.done.title_partial", {
								library: library.fullName,
							})}
				</Typography>

				<List>
					{steps.map((step) => {
						const label = t(`libraries.setup.chapters.${step.id}.label`);
						return (
							<ListItem key={step.id} sx={{ px: 0 }}>
								<ListItemIcon>
									{step.complete ? (
										<CheckCircle color="success" />
									) : (
										<RadioButtonUnchecked color="disabled" />
									)}
								</ListItemIcon>
								<ListItemText
									primary={label}
									secondary={t(
										step.complete
											? "setup.status.done"
											: "setup.status.not_started",
									)}
								/>
								<CustomLink
									to="/libraries/$libraryId/setup/$step"
									params={{ libraryId, step: step.id }}
									// Every row says "Change" or "Finish"; the name says which (2.4.4)
									aria-label={t(
										step.complete
											? "setup.done.change_named"
											: "setup.done.revisit_named",
										{ label },
									)}
								>
									{t(
										step.complete ? "setup.done.change" : "setup.done.revisit",
									)}
								</CustomLink>
							</ListItem>
						);
					})}
				</List>

				{ingest && (
					<Alert
						severity={ingest.isIngestOutstanding ? "warning" : "success"}
						role="status"
					>
						{t(ingestMessageKey(ingest), { count: ingest.bibCount })}
					</Alert>
				)}

				<Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
					<CustomLinkButton
						to="/libraries/$libraryId"
						params={{ libraryId }}
						variant="contained"
					>
						{t("libraries.new.go_to_library")}
					</CustomLinkButton>
					<CustomLinkButton
						to="/libraries/new/$step"
						params={{ step: "system" }}
						search={{}}
						variant="outlined"
					>
						{t("libraries.new.add_another")}
					</CustomLinkButton>
				</Stack>
			</Stack>
		</PageContainer>
	);
}
