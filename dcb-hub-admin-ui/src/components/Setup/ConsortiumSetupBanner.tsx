import { useTranslation } from "react-i18next";
import { useAuth } from "react-oidc-context";
import { Alert, AlertTitle, Stack } from "@mui/material";

import { CustomLinkButton } from "@components/CustomLink/CustomLink";
import { useConsortiumSetup } from "@hooks/useConsortiumSetup";
import { useSetupStore } from "@hooks/useSetupStore";
import { SETUP_CHAPTERS } from "./setupChapters";
import { adminOrConsortiumAdmin } from "@constants/roles";

/**
 * "You have not finished setting up" — W-12.
 *
 * Modelled exactly on `LibrarySetupBanner`, one level up, and for the same reason: the
 * onboarding grid knew a library was half-configured, but only as a red cross on a page
 * nobody had a reason to open. The same was true of the consortium itself, except that
 * nothing knew at all.
 *
 * <h2>Three ways it renders nothing</h2>
 *
 *  1. **While the answer is unknown.** Flashing "you have not set up a consortium" at
 *     somebody whose consortium is fine, for the half-second before the query lands, is
 *     worse than a moment's silence - and reading a FAILED request as "not set up" is the
 *     defect `readConsortiumPresence` exists to prevent.
 *  2. **When setup is complete.** A banner that is always there stops being read.
 *  3. **For a user who could not act on it.** Only an administrator can create a
 *     consortium; telling anyone else that one is missing is noise they cannot clear.
 */
export default function ConsortiumSetupBanner() {
	const { t } = useTranslation();
	const auth = useAuth();
	const { state, isPending, isError } = useConsortiumSetup();
	const bannerDismissed = useSetupStore((s) => s.bannerDismissed);
	const dismissBanner = useSetupStore((s) => s.dismissBanner);

	const roles = (auth?.user?.profile?.roles as string[]) || [];
	const canAct = roles.some((role) => adminOrConsortiumAdmin.includes(role));

	if (isPending || isError || !canAct) return null;
	if (state.isComplete || bannerDismissed) return null;

	const outstanding = state.steps.filter(
		(step) => step.available && !step.complete && !step.skipped,
	);
	if (outstanding.length === 0) return null;

	return (
		<Alert
			severity={state.isFresh ? "info" : "warning"}
			sx={{ mb: 3 }}
			onClose={dismissBanner}
			action={
				<CustomLinkButton
					to="/setup/$step"
					params={{ step: state.resumeStep }}
					color="inherit"
					size="small"
					variant="outlined"
				>
					{state.isFresh ? t("setup.banner.start") : t("setup.banner.continue")}
				</CustomLinkButton>
			}
		>
			<AlertTitle>
				{state.isFresh
					? t("setup.banner.fresh_title")
					: t("setup.banner.title")}
			</AlertTitle>
			<Stack spacing={0.5}>
				<span>
					{state.isFresh
						? t("setup.banner.fresh_body")
						: t("setup.banner.body", { count: outstanding.length })}
				</span>
				{!state.isFresh && (
					<span>
						{t("setup.banner.outstanding", {
							steps: outstanding
								.map((step) => t(SETUP_CHAPTERS[step.id].labelKey))
								.join(", "),
						})}
					</span>
				)}
			</Stack>
		</Alert>
	);
}
