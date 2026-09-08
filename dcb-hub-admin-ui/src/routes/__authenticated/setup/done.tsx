import { createFileRoute, redirect } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
	Alert,
	List,
	ListItem,
	ListItemIcon,
	ListItemText,
	Skeleton,
	Stack,
	Typography,
} from "@mui/material";
import {
	CheckCircle,
	RadioButtonUnchecked,
	RemoveCircleOutlined,
} from "@mui/icons-material";

import PageContainer from "@layout/PageContainer/PageContainer";
import Error from "@components/Error/Error";
import {
	CustomLink,
	CustomLinkButton,
} from "@components/CustomLink/CustomLink";
import { SETUP_CHAPTERS } from "@components/Setup/setupChapters";
import { useConsortiumSetup } from "@hooks/useConsortiumSetup";
import { useSetupStore } from "@hooks/useSetupStore";
import { adminOrConsortiumAdmin } from "@constants/roles";
import i18n from "@/i18n";

export const Route = createFileRoute("/__authenticated/setup/done")({
	beforeLoad: ({ context: { auth } }) => {
		if (!auth?.isAuthenticated) return;
		const roles = (auth.user?.profile?.roles as string[]) || [];
		if (!roles.some((role) => adminOrConsortiumAdmin.includes(role))) {
			throw redirect({ to: "/unauthorised" });
		}
	},
	errorComponent: ({ error }) => (
		<PageContainer hideTitleBox hideBreadcrumbs>
			<Error
				title={i18n.t("ui.error.unable_to_load_page")}
				message={error.message}
				action={i18n.t("ui.actions.reload")}
				reload={true}
			/>
		</PageContainer>
	),
	pendingComponent: () => (
		<PageContainer hideTitleBox hideBreadcrumbs>
			<Skeleton variant="rounded" height={420} />
		</PageContainer>
	),
	component: SetupDonePage,
});

/**
 * C7 — "You're set up."
 *
 * An honest inventory, not a celebration. It lists every chapter with what actually
 * happened to it, INCLUDING the ones that were passed over, because a finish screen that
 * only shows ticks is how a half-configured consortium gets signed off as ready. A skipped
 * chapter is a link straight back into itself.
 *
 * The onward links matter as much as the list: creating libraries is the beginning of
 * configuring them, and the onboarding page is where the mappings, locations and ingest
 * that this flow does not cover are picked up.
 */
function SetupDonePage() {
	const { t } = useTranslation();
	const { state, isPending, isError, libraryCount } = useConsortiumSetup();
	const dismissBanner = useSetupStore((s) => s.dismissBanner);

	if (isPending) {
		return (
			<PageContainer hideTitleBox hideBreadcrumbs>
				<Skeleton variant="rounded" height={420} />
			</PageContainer>
		);
	}

	if (isError) {
		return (
			<PageContainer hideTitleBox hideBreadcrumbs>
				<Error
					title={t("setup.error.title")}
					message={t("setup.error.message")}
					action={t("ui.actions.reload")}
					reload={true}
				/>
			</PageContainer>
		);
	}

	const outstanding = state.steps.filter(
		(step) => step.available && !step.complete && !step.skipped,
	);

	return (
		<PageContainer
			title={t("setup.done.page_title")}
			hideTitleBox
			hideBreadcrumbs
		>
			<Stack spacing={3} sx={{ maxWidth: 780 }}>
				<Typography variant="h1" component="h1">
					{state.isComplete
						? t("setup.done.title")
						: t("setup.done.title_partial")}
				</Typography>
				<Typography sx={{ color: "text.secondary" }}>
					{t("setup.done.subtitle", { count: libraryCount })}
					{state.isComplete ? ` ${t("setup.done.revisit_hint")}` : ""}
				</Typography>

				<List>
					{state.steps.map((step) => {
						const label = t(SETUP_CHAPTERS[step.id].labelKey);
						const status = step.complete
							? t("setup.status.done")
							: step.skipped
								? t("setup.status.skipped")
								: t("setup.status.not_started");

						return (
							<ListItem key={step.id} sx={{ px: 0 }}>
								<ListItemIcon>
									{step.complete ? (
										<CheckCircle color="success" />
									) : step.skipped ? (
										<RemoveCircleOutlined color="disabled" />
									) : (
										<RadioButtonUnchecked color="disabled" />
									)}
								</ListItemIcon>
								<ListItemText
									primary={label}
									// The status is words, not the icon's colour.
									secondary={status}
								/>
								{/* EVERY reachable chapter is a link, complete ones included.
								    This page is where a finished setup now opens, so it is the
								    index of the flow rather than a report on it - and a list
								    that only linked unfinished chapters would be a dead end for
								    exactly the person who came back to change a logo. */}
								{step.available && (
									<CustomLink
										to="/setup/$step"
										params={{ step: step.id }}
										// Six links all reading "Go to this step" are six
										// identical entries in a screen reader's link list. The
										// visible text stays short; the accessible name says
										// which chapter (WCAG 2.4.4).
										aria-label={t(
											step.complete
												? "setup.done.change_named"
												: "setup.done.revisit_named",
											{ label },
										)}
									>
										{t(
											step.complete
												? "setup.done.change"
												: "setup.done.revisit",
										)}
									</CustomLink>
								)}
							</ListItem>
						);
					})}
				</List>

				{outstanding.length > 0 && (
					<Alert severity="info">
						{t("setup.done.outstanding", {
							steps: outstanding
								.map((step) => t(SETUP_CHAPTERS[step.id].labelKey))
								.join(", "),
						})}
					</Alert>
				)}

				{/* Creating a library is not configuring it. Mappings, locations and
				    ingest are the onboarding page's job, and pointing there is the
				    difference between "set up" and "working". */}
				<Alert severity="info">{t("setup.done.next_steps")}</Alert>

				<Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
					<CustomLinkButton to="/consortium/onboarding" variant="contained">
						{t("setup.done.go_onboarding")}
					</CustomLinkButton>
					<CustomLinkButton to="/consortium" variant="outlined">
						{t("setup.done.go_consortium")}
					</CustomLinkButton>
					{/* Dismissing on the way out, not on arrival: somebody who reads this
					    page and then goes back to a chapter has not finished with the
					    prompt yet. */}
					<CustomLinkButton to="/" variant="outlined" onClick={dismissBanner}>
						{t("setup.done.go_home")}
					</CustomLinkButton>
				</Stack>
			</Stack>
		</PageContainer>
	);
}
