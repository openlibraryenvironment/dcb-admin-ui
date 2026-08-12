import { useTranslation } from "react-i18next";
import { useRouter } from "@tanstack/react-router";
import { Alert, AlertTitle, Button, Stack, Typography } from "@mui/material";
import { OpenInNew } from "@mui/icons-material";

interface CompletionStepProps {
	libraryId?: string;
	libraryName?: string;
	consortiumName?: string;
	/**
	 * The Host LMS ingest probe timed out rather than reported a real failure,
	 * so the harvest has probably worked and just took longer than the 20 second
	 * cap dcb-service allows it.
	 */
	ingestTimedOut?: boolean;
}

/**
 * The end of the wizard, and the point at which somebody doing initial
 * consortium setup finds out whether they have to start the whole thing again
 * from the libraries grid.
 *
 * The last screen used to be the locations step with a green "Submit" button
 * that submitted nothing - it called the same close handler as Cancel. Nothing
 * confirmed the library existed, nothing linked to it, and adding the next of
 * fifty libraries meant closing the dialog and reopening it.
 */
export default function CompletionStep({
	libraryId,
	libraryName,
	consortiumName,
	ingestTimedOut = false,
}: CompletionStepProps) {
	const { t } = useTranslation();
	const router = useRouter();

	return (
		<Stack spacing={2} sx={{ mt: 1 }}>
			<Alert severity="success">
				<AlertTitle>{t("libraries.new.done_title")}</AlertTitle>
				{consortiumName
					? t("libraries.new.done_body", {
							library: libraryName,
							consortium: consortiumName,
						})
					: t("libraries.new.done_body_no_consortium", {
							library: libraryName,
						})}
			</Alert>

			{ingestTimedOut && (
				<Alert severity="warning">
					<AlertTitle>
						{t("hostlms.verification.ingest_timeout_title")}
					</AlertTitle>
					{t("hostlms.verification.ingest_timeout_advice")}
					{libraryId && (
						<Stack sx={{ mt: 1, alignItems: "flex-start" }}>
							<Button
								onClick={() =>
									router.navigate({
										to: "/libraries/$libraryId/bibs",
										params: { libraryId },
									})
								}
								size="small"
								variant="outlined"
								color="inherit"
								endIcon={<OpenInNew />}
							>
								{t("libraries.new.view_bib_records")}
							</Button>
						</Stack>
					)}
				</Alert>
			)}

			<Typography>{t("libraries.new.done_next_steps")}</Typography>
			<Stack component="ul" spacing={0.5} sx={{ m: 0, pl: 3 }}>
				<li>{t("libraries.new.done_next_mappings")}</li>
				<li>{t("libraries.new.done_next_locations")}</li>
				<li>{t("libraries.new.done_next_onboarding")}</li>
			</Stack>

			{/* Initial setup is dozens of libraries in one sitting, so the "do it
			    again" path is a first-class button rather than a reopen. */}
			<Alert severity="info">{t("libraries.new.add_another_hint")}</Alert>
		</Stack>
	);
}
