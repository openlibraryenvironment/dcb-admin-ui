import { lazy, Suspense, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	Alert,
	AlertTitle,
	Button,
	Card,
	CardActions,
	CardContent,
	Skeleton,
	Stack,
	Typography,
} from "@mui/material";
import { LibraryAdd, UploadFile } from "@mui/icons-material";

import SetupFooter from "../SetupFooter";
import { useSetupNavigation } from "@hooks/useSetupNavigation";
import { useConsortiumSetup } from "@hooks/useConsortiumSetup";

// Both are heavy and neither is opened by most visits to this chapter: the New Library
// wizard is thirteen steps and several mutations, and the importer pulls in a table, a
// parser and two lookups. Splitting them keeps the chapter itself small.
const NewLibrary = lazy(() => import("@forms/NewLibrary/NewLibrary"));
const LibraryImport = lazy(
	() => import("@components/LibraryImport/LibraryImport"),
);

/**
 * C6 — "Now let's add your libraries."
 *
 * Two routes in, presented as a choice rather than a default with an escape hatch, because
 * which one is right depends entirely on where the consortium is starting from. A brand
 * new service adds its first library by hand and wants the guided path; a consortium
 * migrating five hundred members already has the spreadsheet and would never do it five
 * hundred times.
 *
 * The single-library route embeds the EXISTING wizard rather than reimplementing it. That
 * wizard already handles Host LMS creation and verification, mappings, locations, resume
 * from a half-finished library, and a long list of defects that were found and fixed in
 * it. A second implementation here would inherit none of that.
 */
export default function LibrariesChapter() {
	const { t } = useTranslation();
	const { goNext, goBack, skipAndContinue } = useSetupNavigation("libraries");
	const { consortium, consortiumGroupId, libraryCount } = useConsortiumSetup();

	const [showWizard, setShowWizard] = useState(false);
	const [showImport, setShowImport] = useState(false);

	return (
		<Stack spacing={3}>
			{libraryCount > 0 && (
				<Alert severity="success">
					<AlertTitle>{t("setup.libraries.already_title")}</AlertTitle>
					{t("setup.libraries.already_body", { count: libraryCount })}
				</Alert>
			)}

			<Stack direction={{ xs: "column", md: "row" }} spacing={2}>
				<Card variant="outlined" sx={{ flex: 1 }}>
					<CardContent>
						<Typography variant="h3" component="h2" sx={{ mb: 1 }}>
							{t("setup.libraries.one_title")}
						</Typography>
						<Typography variant="body2" sx={{ color: "text.secondary" }}>
							{t("setup.libraries.one_body")}
						</Typography>
					</CardContent>
					<CardActions>
						<Button
							startIcon={<LibraryAdd />}
							variant="contained"
							onClick={() => setShowWizard(true)}
						>
							{t("setup.libraries.one_action")}
						</Button>
					</CardActions>
				</Card>

				<Card variant="outlined" sx={{ flex: 1 }}>
					<CardContent>
						<Typography variant="h3" component="h2" sx={{ mb: 1 }}>
							{t("setup.libraries.many_title")}
						</Typography>
						<Typography variant="body2" sx={{ color: "text.secondary" }}>
							{t("setup.libraries.many_body")}
						</Typography>
					</CardContent>
					<CardActions>
						<Button
							startIcon={<UploadFile />}
							variant="outlined"
							onClick={() => setShowImport(true)}
						>
							{t("setup.libraries.many_action")}
						</Button>
					</CardActions>
				</Card>
			</Stack>

			{/* The import creates libraries but not their mappings or locations, so the
			    onboarding page is where the rest of the work is picked up. Said here
			    rather than discovered later. */}
			<Alert severity="info">{t("setup.libraries.after_import")}</Alert>

			<SetupFooter
				onBack={goBack}
				onContinue={goNext}
				continueLabel={t("setup.actions.finish")}
				onSkip={skipAndContinue}
				skipLabel={t("setup.libraries.skip")}
			/>

			<Suspense fallback={<Skeleton variant="rounded" height={4} />}>
				{showWizard && (
					<NewLibrary
						show={showWizard}
						onClose={() => setShowWizard(false)}
						consortiumName={consortium?.displayName ?? consortium?.name}
					/>
				)}
				{showImport && (
					<LibraryImport
						show={showImport}
						onClose={() => setShowImport(false)}
						consortiumGroupId={consortiumGroupId}
					/>
				)}
			</Suspense>
		</Stack>
	);
}
