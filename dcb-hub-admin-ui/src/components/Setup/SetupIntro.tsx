import { useTranslation } from "react-i18next";
import { Alert, AlertTitle, Box, Typography } from "@mui/material";

/**
 * What this will take, and what you need in front of you, before it starts.
 *
 * <h2>The failure it prevents</h2>
 *
 * Setup ends by asking for a library, and adding a library means the Host LMS it runs on:
 * its base URL, its API key and secret, and for Sierra its default agency code and page
 * size. Somebody who reaches that point without those to hand has spent nine minutes to
 * arrive at a form they cannot finish, and the flow has told them nothing until then.
 *
 * Saying so on the first screen costs five lines and removes the single most likely place
 * for a first run to stall. It is the same reason the banner says "about ten minutes":
 * people abandon an unbounded task, and they do not abandon a bounded one.
 *
 * <h2>Why only on a fresh instance, and only on the first chapter</h2>
 *
 * It is an answer to "what am I in for", which is a question asked once. A returning
 * administrator changing a logo already knows, and a panel repeating the prerequisites at
 * them on every visit is the kind of thing people learn to scroll past - which costs
 * nothing here and costs a great deal on the notice that actually matters.
 */
export default function SetupIntro() {
	const { t } = useTranslation();

	return (
		<Alert severity="info" icon={false} sx={{ mb: 3 }}>
			<AlertTitle>{t("setup.intro.title")}</AlertTitle>
			<Typography variant="body2" sx={{ mb: 1 }}>
				{t("setup.intro.time")}
			</Typography>
			<Typography variant="body2" component="p" sx={{ fontWeight: 600 }}>
				{t("setup.intro.needs_title")}
			</Typography>
			{/* A real list, so it is announced as three items rather than as one run-on
			    sentence, and so the reader can skip it in one keystroke. */}
			<Box component="ul" sx={{ m: 0, pl: 3 }}>
				<Typography component="li" variant="body2">
					{t("setup.intro.needs_consortium")}
				</Typography>
				<Typography component="li" variant="body2">
					{t("setup.intro.needs_contact")}
				</Typography>
				<Typography component="li" variant="body2">
					{t("setup.intro.needs_hostlms")}
				</Typography>
			</Box>
		</Alert>
	);
}
