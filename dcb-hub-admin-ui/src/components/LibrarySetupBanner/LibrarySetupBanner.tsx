import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Alert, AlertTitle, Button, Stack } from "@mui/material";

import NewLibrary from "@forms/NewLibrary/NewLibrary";
import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { librarySetupCountsQuery } from "@/queryOptions/librarySetup";
import { evaluateLibrarySetup } from "@helpers/librarySetup";

interface LibrarySetupBannerProps {
	library: any;
	/** Only administrators can act on it, so only they are shown it. */
	canEdit: boolean;
}

/**
 * Tells the user whether a library's setup is finished and, when it is not, what
 * it still needs, reopening the new-library wizard at the first outstanding step.
 *
 * The wizard could previously only be completed in one sitting: if it was
 * closed after the library was created (which happens on the contacts step)
 * everything after that was simply never done, and nothing on the library said
 * so. The onboarding grid knew, but only as a red cross on a consortium-wide
 * page - not where someone looking at the library would see it.
 */
export default function LibrarySetupBanner({
	library,
	canEdit,
}: LibrarySetupBannerProps) {
	const { t } = useTranslation();
	const gqlClient = useGraphQLClient();
	const [showWizard, setShowWizard] = useState(false);

	const { data: counts } = useQuery(
		librarySetupCountsQuery(gqlClient, library),
	);

	// Say nothing until the counts are in. A failed count is not a zero: read as
	// one, it reported mappings and pickup locations missing from a library that
	// had them.
	if (!counts || !library) return null;

	const setup = evaluateLibrarySetup(library, counts);

	if (setup.isComplete) {
		return (
			<Alert severity="success" role="status" sx={{ mb: 3 }}>
				<AlertTitle>{t("libraries.setup.complete_title")}</AlertTitle>
				{t("libraries.setup.complete_body", {
					steps: setup.steps
						.filter((step) => step.applicable)
						.map((step) => t(`libraries.setup.step.${step.id}`))
						.join(", "),
				})}
			</Alert>
		);
	}

	const outstanding = setup.steps.filter(
		(step) => step.applicable && !step.complete,
	);

	return (
		<>
			<Alert
				severity="warning"
				sx={{ mb: 3 }}
				action={
					canEdit ? (
						<Button
							color="inherit"
							size="small"
							variant="outlined"
							onClick={() => setShowWizard(true)}
						>
							{t("libraries.setup.finish")}
						</Button>
					) : undefined
				}
			>
				<AlertTitle>{t("libraries.setup.incomplete_title")}</AlertTitle>
				<Stack spacing={0.5}>
					<span>
						{t("libraries.setup.incomplete_body", {
							count: outstanding.length,
						})}
					</span>
					<span>
						{t("libraries.setup.outstanding", {
							steps: outstanding
								.map((step) => t(`libraries.setup.step.${step.id}`))
								.join(", "),
						})}
					</span>
				</Stack>
			</Alert>

			{showWizard && (
				<NewLibrary
					show={showWizard}
					onClose={() => setShowWizard(false)}
					resumeLibrary={library}
					startAtStep={setup.firstIncompleteStep}
				/>
			)}
		</>
	);
}
