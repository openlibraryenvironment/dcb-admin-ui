import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Alert, AlertTitle, Stack } from "@mui/material";

import { CustomLinkButton } from "@components/CustomLink/CustomLink";
import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { librarySetupCountsQuery } from "@/queryOptions/librarySetup";
import { evaluateLibrarySetup } from "@helpers/librarySetup";

interface LibrarySetupBannerProps {
	library: any;
	/** Only administrators can act on it, so only they are shown it. */
	canEdit: boolean;
}

/**
 * Tells the user whether a library's setup is finished and, when it is not, what it still
 * needs, linking to the first outstanding chapter of its setup - a URL, so it can be sent
 * to whoever is finishing it.
 */
export default function LibrarySetupBanner({
	library,
	canEdit,
}: LibrarySetupBannerProps) {
	const { t } = useTranslation();
	const gqlClient = useGraphQLClient();

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
						<CustomLinkButton
							to="/libraries/$libraryId/setup/$step"
							params={{
								libraryId: library.id,
								step: setup.firstIncompleteStep ?? "profile",
							}}
							color="inherit"
							size="small"
							variant="outlined"
						>
							{t("libraries.setup.finish")}
						</CustomLinkButton>
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
		</>
	);
}
