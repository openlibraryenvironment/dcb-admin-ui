import {
	createFileRoute,
	redirect,
	useParams,
	useSearch,
} from "@tanstack/react-router";
import { Skeleton, Stack } from "@mui/material";
import { useTranslation } from "react-i18next";

import PageContainer from "@layout/PageContainer/PageContainer";
import Error from "@components/Error/Error";
import SetupLayout from "@components/Setup/SetupLayout";
import SystemChapter from "@components/LibrarySetup/chapters/SystemChapter";
import ConnectionChapter from "@components/LibrarySetup/chapters/ConnectionChapter";
import ProfileChapter from "@components/LibrarySetup/chapters/ProfileChapter";
import { newLibraryFlow } from "@components/LibrarySetup/libraryFlow";
import { useIsConsortiumAdmin } from "@hooks/useIsConsortiumAdmin";
import {
	isNewLibraryStepId,
	newLibraryFlowState,
	newLibrarySearchSchema,
	type NewLibraryStepId,
} from "@helpers/librarySetupFlow";
import { adminOrConsortiumAdmin } from "@constants/roles";
import i18n from "@/i18n";
import { errorForDisplay } from "@helpers/safeErrorLog";

export const Route = createFileRoute("/__authenticated/libraries/new/$step")({
	validateSearch: newLibrarySearchSchema,
	beforeLoad: ({ params: { step }, search, context: { auth } }) => {
		const state = newLibraryFlowState(search);
		// A hand-typed step, or one whose earlier answers are missing, goes to the first
		// question still open rather than rendering a chapter that cannot be answered
		const reachable =
			isNewLibraryStepId(step) &&
			state.steps.some((entry) => entry.id === step && entry.available);
		if (!reachable) {
			throw redirect({
				to: "/libraries/new/$step",
				params: {
					step: isNewLibraryStepId(state.firstIncompleteStep ?? "")
						? (state.firstIncompleteStep as NewLibraryStepId)
						: "system",
				},
				search,
			});
		}

		if (!auth?.isAuthenticated) return;

		// Creates a Host LMS and a library. Hiding the action is not a control; this is.
		const roles = (auth.user?.profile?.roles as string[]) || [];
		if (!roles.some((role) => adminOrConsortiumAdmin.includes(role))) {
			throw redirect({ to: "/unauthorised" });
		}
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
	pendingComponent: () => (
		<PageContainer hideTitleBox hideBreadcrumbs>
			{/* The frame it replaces: rail, heading, subtitle, body */}
			<Stack direction={{ xs: "column", md: "row" }} spacing={4}>
				<Skeleton variant="rounded" width={240} height={320} />
				<Stack spacing={2} sx={{ flexGrow: 1, maxWidth: 780 }}>
					<Skeleton variant="text" width={120} />
					<Skeleton variant="text" width="60%" height={48} />
					<Skeleton variant="text" width="80%" />
					<Skeleton variant="rounded" height={320} />
				</Stack>
			</Stack>
		</PageContainer>
	),
	component: NewLibraryPage,
});

function NewLibraryPage() {
	const { t } = useTranslation();
	const { step } = useParams({ from: "/__authenticated/libraries/new/$step" });
	const search = useSearch({ from: "/__authenticated/libraries/new/$step" });
	const isAdmin = useIsConsortiumAdmin();

	// beforeLoad runs before the stored session resolves on a cold load; this is the half
	// that catches it. See useIsConsortiumAdmin.
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

	const flow = newLibraryFlow(newLibraryFlowState(search), search);

	return (
		<SetupLayout step={step} flow={flow}>
			{step === "system" ? (
				<SystemChapter search={search} />
			) : step === "connection" ? (
				<ConnectionChapter search={search} />
			) : (
				<ProfileChapter kind="new" search={search} />
			)}
		</SetupLayout>
	);
}
