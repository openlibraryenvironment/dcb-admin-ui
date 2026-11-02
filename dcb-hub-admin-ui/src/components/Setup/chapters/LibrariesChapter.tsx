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
import { CustomLinkButton } from "@components/CustomLink/CustomLink";
import { useSetupNavigation } from "@hooks/useSetupNavigation";
import { useConsortiumSetup } from "@hooks/useConsortiumSetup";

// Most visits never open the importer, and it pulls in a table, a parser and two lookups.
const LibraryImport = lazy(
	() => import("@components/LibraryImport/LibraryImport"),
);

/**
 * "Now let's add your libraries."
 *
 * Two routes in, presented as a choice rather than a default with an escape hatch, because
 * which one is right depends entirely on where the consortium is starting from. A brand
 * new service adds its first library by hand and wants the guided path; a consortium
 * migrating five hundred members already has the spreadsheet and would never do it five
 * hundred times.
 *
 * The single-library route is the library setup conversation at /libraries/new, linked
 * rather than embedded, so this chapter stays where it is while a library is added.
 */
export default function LibrariesChapter() {
	const { t } = useTranslation();
	const { goNext, goBack, skipAndContinue } = useSetupNavigation("libraries");
	const { consortiumGroupId, libraryCount } = useConsortiumSetup();

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
						{/* A link, so it can open in a new tab and leave setup where it is */}
						<CustomLinkButton
							to="/libraries/new/$step"
							params={{ step: "system" }}
							search={{}}
							startIcon={<LibraryAdd />}
							variant="contained"
						>
							{t("setup.libraries.one_action")}
						</CustomLinkButton>
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
