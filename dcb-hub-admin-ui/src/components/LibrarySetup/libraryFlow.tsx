import { CustomLink } from "@components/CustomLink/CustomLink";
import { railLinkSx, type SetupFlow } from "@components/Setup/setupFlow";
import {
	type LibraryFlowState,
	type LibraryFlowStepId,
	type NewLibrarySearch,
} from "@helpers/librarySetupFlow";

const copyOf = (id: LibraryFlowStepId) => ({
	labelKey: `libraries.setup.chapters.${id}.label`,
	titleKey: `libraries.setup.chapters.${id}.title`,
	subtitleKey: `libraries.setup.chapters.${id}.subtitle`,
});

const toFlow = (
	state: LibraryFlowState,
	renderLink: SetupFlow["renderLink"],
): SetupFlow => ({
	steps: state.steps.map((step) => ({ ...step, ...copyOf(step.id) })),
	progress: state.progress,
	pageTitleKey: "libraries.setup.page_title",
	renderLink,
});

/** Before the library exists; every link keeps the answers already in the URL. */
export const newLibraryFlow = (
	state: LibraryFlowState,
	search: NewLibrarySearch,
): SetupFlow =>
	toFlow(state, (stepId, label) => (
		<CustomLink
			to="/libraries/new/$step"
			params={{ step: stepId }}
			search={search}
			underline="hover"
			sx={railLinkSx}
		>
			{label}
		</CustomLink>
	));

/** Once it exists. Its system and connection are its Host LMS, edited on that page. */
export const existingLibraryFlow = (
	state: LibraryFlowState,
	libraryId: string,
	hostLmsId: string | undefined,
): SetupFlow =>
	toFlow(state, (stepId, label) =>
		stepId === "system" || stepId === "connection" ? (
			hostLmsId ? (
				<CustomLink
					to="/hostlmss/$hostlmsId"
					params={{ hostlmsId: hostLmsId }}
					underline="hover"
					sx={railLinkSx}
				>
					{label}
				</CustomLink>
			) : (
				label
			)
		) : (
			<CustomLink
				to="/libraries/$libraryId/setup/$step"
				params={{ libraryId, step: stepId }}
				underline="hover"
				sx={railLinkSx}
			>
				{label}
			</CustomLink>
		),
	);
