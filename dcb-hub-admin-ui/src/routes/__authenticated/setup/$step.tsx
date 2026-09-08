import { createFileRoute, redirect } from "@tanstack/react-router";
import { Alert, Skeleton, Stack } from "@mui/material";
import { useTranslation } from "react-i18next";

import PageContainer from "@layout/PageContainer/PageContainer";
import Error from "@components/Error/Error";
import SetupLayout from "@components/Setup/SetupLayout";
import AppearanceChapter from "@components/Setup/chapters/AppearanceChapter";
import ConsortiumChapter from "@components/Setup/chapters/ConsortiumChapter";
import HowItWorksChapter from "@components/Setup/chapters/HowItWorksChapter";
import ContactsChapter from "@components/Setup/chapters/ContactsChapter";
import DiscoveryChapter from "@components/Setup/chapters/DiscoveryChapter";
import LibrariesChapter from "@components/Setup/chapters/LibrariesChapter";
import { useConsortiumSetup } from "@hooks/useConsortiumSetup";
import { useIsConsortiumAdmin } from "@hooks/useIsConsortiumAdmin";
import {
	consortiumSetupSteps,
	isConsortiumSetupStepId,
	type ConsortiumSetupStepId,
} from "@helpers/consortiumSetup";
import { adminOrConsortiumAdmin } from "@constants/roles";
import i18n from "@/i18n";

export const Route = createFileRoute("/__authenticated/setup/$step")({
	// The step is a path segment, so a hand-typed or stale bookmarked URL can carry
	// anything. Validating it here turns "/setup/nonsense" into a redirect to the start
	// of the flow rather than a chapter lookup that resolves to undefined and throws.
	beforeLoad: ({ params: { step }, context: { auth } }) => {
		if (!isConsortiumSetupStepId(step)) {
			throw redirect({
				to: "/setup/$step",
				params: { step: consortiumSetupSteps()[0] },
			});
		}

		if (!auth?.isAuthenticated) return;

		// Setup writes the consortium record, its functional settings and its brand.
		// Hiding the nav entry is not a control; this is.
		const roles = (auth.user?.profile?.roles as string[]) || [];
		if (!roles.some((role) => adminOrConsortiumAdmin.includes(role))) {
			throw redirect({ to: "/unauthorised" });
		}
	},

	errorComponent: ({ error }) => (
		<PageContainer hideTitleBox hideBreadcrumbs>
			<Error
				title={i18n.t("ui.error.unable_to_load_page")}
				message={error.message}
				action={i18n.t("ui.actions.reload")}
				reload={true}
			/>
		</PageContainer>
	),

	pendingComponent: () => (
		<PageContainer hideTitleBox hideBreadcrumbs>
			{/* Sized to the chapter frame it replaces: rail, heading, subtitle, body.
			    A skeleton of the wrong height is a layout shift with extra steps. */}
			<Stack direction={{ xs: "column", md: "row" }} spacing={4}>
				<Skeleton variant="rounded" width={240} height={220} />
				<Stack spacing={2} sx={{ flexGrow: 1, maxWidth: 780 }}>
					<Skeleton variant="text" width={120} />
					<Skeleton variant="text" width="60%" height={48} />
					<Skeleton variant="text" width="80%" />
					<Skeleton variant="rounded" height={320} />
				</Stack>
			</Stack>
		</PageContainer>
	),

	component: SetupStepPage,
});

const CHAPTERS: Record<ConsortiumSetupStepId, () => React.ReactNode> = {
	appearance: AppearanceChapter,
	consortium: ConsortiumChapter,
	howItWorks: HowItWorksChapter,
	contacts: ContactsChapter,
	discovery: DiscoveryChapter,
	libraries: LibrariesChapter,
};

function SetupStepPage() {
	const { t } = useTranslation();
	const { step } = Route.useParams();
	const isAdmin = useIsConsortiumAdmin();
	const { state, isPending, isError } = useConsortiumSetup();

	// The second half of the guard. beforeLoad runs before react-oidc-context has
	// resolved the stored session on a cold load, so it cannot see the roles and
	// silently lets the route through - see useIsConsortiumAdmin. The protected content
	// is never rendered.
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

	// beforeLoad has already rejected anything else; this narrows the type.
	const stepId = step as ConsortiumSetupStepId;
	const Chapter = CHAPTERS[stepId];

	if (isPending) {
		return (
			<PageContainer hideTitleBox hideBreadcrumbs>
				<Skeleton variant="rounded" height={480} />
			</PageContainer>
		);
	}

	// A failed read is NOT an empty instance. Saying "let's set up your consortium" to
	// somebody whose consortium exists but whose request timed out is the exact defect
	// readConsortiumPresence was written to stop, one level up.
	if (isError) {
		return (
			<PageContainer hideTitleBox hideBreadcrumbs>
				<Error
					title={t("setup.error.title")}
					message={t("setup.error.message")}
					action={t("ui.actions.reload")}
					reload={true}
				/>
			</PageContainer>
		);
	}

	const chapterState = state.steps.find((entry) => entry.id === stepId);

	return (
		<SetupLayout step={stepId} state={state}>
			{chapterState?.available ? (
				<Chapter />
			) : (
				// Reached by typing a URL or following a stale bookmark: every chapter
				// after the first two needs the consortium record to exist. Say which
				// and offer the way there, rather than rendering a form whose save
				// cannot succeed.
				<Alert severity="info">{t("setup.needs_consortium")}</Alert>
			)}
		</SetupLayout>
	);
}
