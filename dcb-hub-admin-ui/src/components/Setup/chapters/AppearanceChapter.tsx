import { useTranslation } from "react-i18next";
import { Alert, Stack } from "@mui/material";

import ThemeControls from "@components/ThemeControls/ThemeControls";
import LanguageSwitcher from "@layout/Header/LanguageSwitcher";
import SetupFooter from "../SetupFooter";
import { useSetupNavigation } from "@hooks/useSetupNavigation";

/**
 * C1 — "How should DCB Admin look to you?"
 *
 * First on purpose. It writes nothing, it is instantly reversible, it costs no backend
 * call, and it answers the user before it asks them for anything - which is a different
 * opening move from a form demanding a consortium name from somebody who has not yet seen
 * the application do a single thing.
 *
 * It is also the chapter with the most direct accessibility value in it: somebody who
 * needs high contrast, or a typeface they can actually read, gets to set that BEFORE
 * reading five more screens of setup, rather than discovering the control on a profile
 * page afterwards.
 *
 * Every choice here is per user and stored locally. Nothing on this screen is a property
 * of the consortium, and a colleague signing in on another machine sets their own.
 */
export default function AppearanceChapter() {
	const { t } = useTranslation();
	// `skipAndContinue`, not `goNext`: this chapter writes nothing, so there is no data
	// to read back and "done" can only mean "seen". Recording it as settled is what stops
	// the banner and the rail reporting it outstanding forever.
	const { skipAndContinue } = useSetupNavigation("appearance");

	return (
		<Stack spacing={3}>
			<Alert severity="info">{t("setup.appearance.scope_note")}</Alert>

			<ThemeControls showFont />

			<Stack spacing={1}>
				<LanguageSwitcher />
			</Stack>

			{/* Continuing IS the answer here - the defaults are a valid choice - so a
			    separate "skip" would do exactly the same thing and only add a decision. */}
			<SetupFooter
				onContinue={skipAndContinue}
				continueLabel={t("setup.actions.looks_good")}
			/>
		</Stack>
	);
}
