import {
	Navigate,
	createFileRoute,
	redirect,
	useNavigate,
	useParams,
} from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Skeleton, Stack } from "@mui/material";
import { useTranslation } from "react-i18next";

import PageContainer from "@layout/PageContainer/PageContainer";
import Error from "@components/Error/Error";
import SetupLayout from "@components/Setup/SetupLayout";
import ProfileChapter from "@components/LibrarySetup/chapters/ProfileChapter";
import ContactsChapter from "@components/LibrarySetup/chapters/ContactsChapter";
import GroupChapter from "@components/LibrarySetup/chapters/GroupChapter";
import {
	LocationsChapter,
	MappingsChapter,
	NumbersChapter,
} from "@components/LibrarySetup/chapters/ImportChapters";
import type { LibraryChapterProps } from "@components/LibrarySetup/chapters/chapterProps";
import { existingLibraryFlow } from "@components/LibrarySetup/libraryFlow";
import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { useIsConsortiumAdmin } from "@hooks/useIsConsortiumAdmin";
import {
	fetchLibrary,
	libraryQuery,
	libraryQueryKey,
} from "@/queryOptions/library";
import { librarySetupCountsQuery } from "@/queryOptions/librarySetup";
import { createGraphQLClient } from "@helpers/createGraphQLClient";
import {
	isLibrarySetupStepId,
	type LibraryFlowStepId,
} from "@helpers/librarySetupFlow";
import { libraryFlowState } from "@helpers/librarySetup";
import { adminOrConsortiumAdmin } from "@constants/roles";
import i18n from "@/i18n";
import { errorForDisplay } from "@helpers/safeErrorLog";

const FROM = "/__authenticated/libraries/$libraryId/setup/$step";

export const Route = createFileRoute(
	"/__authenticated/libraries/$libraryId/setup/$step",
)({
	beforeLoad: ({ params: { libraryId, step }, context: { auth } }) => {
		if (!isLibrarySetupStepId(step)) {
			throw redirect({
				to: "/libraries/$libraryId/setup/$step",
				params: { libraryId, step: "profile" },
			});
		}

		if (!auth?.isAuthenticated) return;

		const roles = (auth.user?.profile?.roles as string[]) || [];
		if (!roles.some((role) => adminOrConsortiumAdmin.includes(role))) {
			throw redirect({ to: "/unauthorised" });
		}
	},
	// The record every chapter is seeded from: without it there is nothing to render
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
	pendingComponent: () => <SetupSkeleton />,
	component: LibrarySetupPage,
});

function SetupSkeleton() {
	return (
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
	);
}

const CHAPTERS: Partial<
	Record<LibraryFlowStepId, (props: LibraryChapterProps) => React.ReactNode>
> = {
	profile: (props) => <ProfileChapter kind="existing" {...props} />,
	contacts: ContactsChapter,
	group: GroupChapter,
	refMappings: MappingsChapter,
	numMappings: NumbersChapter,
	locations: LocationsChapter,
};

function LibrarySetupPage() {
	const { t } = useTranslation();
	const { libraryId, step } = useParams({ from: FROM });
	const navigate = useNavigate();
	const gqlClient = useGraphQLClient();
	const isAdmin = useIsConsortiumAdmin();

	const {
		data: library,
		isPending,
		isError,
	} = useQuery(libraryQuery(gqlClient, libraryId));
	const counts = useQuery(librarySetupCountsQuery(gqlClient, library));

	// The second half of the guard: beforeLoad cannot see roles on a cold load
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

	if (isPending || (library && counts.isPending)) return <SetupSkeleton />;

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

	// A failed count is not a zero; read as one it reported work missing that was done
	const state = libraryFlowState(library, counts.data ?? {});
	const flow = existingLibraryFlow(
		state,
		libraryId,
		library.agency?.hostLms?.id,
	);
	const order = state.steps
		.map((entry) => entry.id)
		.filter((id) => CHAPTERS[id]);
	const index = order.indexOf(step as LibraryFlowStepId);
	const Chapter = CHAPTERS[step as LibraryFlowStepId];

	// A step this library's system does not need, such as numeric ranges for Alma
	if (!Chapter || index === -1) {
		return (
			<Navigate
				to="/libraries/$libraryId/setup/$step"
				params={{ libraryId, step: state.firstIncompleteStep ?? "profile" }}
				replace
			/>
		);
	}

	const onNext = () =>
		index + 1 < order.length
			? navigate({
					to: "/libraries/$libraryId/setup/$step",
					params: { libraryId, step: order[index + 1] },
				})
			: navigate({
					to: "/libraries/$libraryId/setup/done",
					params: { libraryId },
				});
	const onBack = () =>
		index > 0
			? navigate({
					to: "/libraries/$libraryId/setup/$step",
					params: { libraryId, step: order[index - 1] },
				})
			: navigate({ to: "/libraries/$libraryId", params: { libraryId } });

	return (
		<SetupLayout step={step} flow={flow}>
			{/* Keyed on the step, so each chapter's form is seeded from the record afresh */}
			<Chapter key={step} library={library} onNext={onNext} onBack={onBack} />
		</SetupLayout>
	);
}
