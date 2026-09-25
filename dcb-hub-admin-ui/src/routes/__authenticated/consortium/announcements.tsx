import { useState } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
	Alert,
	Button,
	Chip,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
	FormControlLabel,
	Grid,
	Stack,
	Switch,
	TextField,
	Typography,
} from "@mui/material";

import PageContainer from "@layout/PageContainer/PageContainer";
import ConsortiumTabs from "@components/ConsortiumTabs/ConsortiumTabs";
import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { getAnnouncements } from "@queries/getAnnouncements";
import {
	createAnnouncementQuery,
	deleteAnnouncementQuery,
} from "@mutations/announcements";
import { consortiumBasicsQuery } from "@/queryOptions/consortium";
import { libraryCountQuery } from "@/queryOptions/setup";
import { isAnnouncementsEnabled } from "@helpers/featureFlags";
import { useIsConsortiumAdmin } from "@hooks/useIsConsortiumAdmin";
import ErrorComponent from "@components/Error/Error";
import type {
	CreateAnnouncementMutation,
	CreateAnnouncementMutationVariables,
	DeleteAnnouncementMutation,
	DeleteAnnouncementMutationVariables,
} from "@generated/graphql";

/**
 * A consortium announcement reaches every patron of every member library, so publishing asks
 * once more and the question names the reach. It counts member LIBRARIES, not patrons: DCB
 * holds no patron roster, and an estimate would be a guess in a dialog people must trust.
 *
 * Urgent exists only at this scope: a routine consortium notice steps aside for a library's
 * own, and an urgent one shows beneath it.
 */
export const Route = createFileRoute(
	"/__authenticated/consortium/announcements",
)({
	// The tab is hidden while the flag is off, but the URL is still typeable — and every
	// operation on this page is one dcb-service declares on no release, so each would be a
	// validation error that fails the whole request.
	beforeLoad: ({ context: { auth } }) => {
		if (!isAnnouncementsEnabled()) {
			throw redirect({ to: "/consortium" });
		}

		// MUST come after the flag check and before the roles: react-oidc-context
		// restores the session asynchronously, so on a cold load beforeLoad runs before
		// the roles exist. The render guard below is the half that covers that path.
		if (!auth?.isAuthenticated) return;

		// dcb-service refuses consortium scope to anyone but a CONSORTIUM_ADMIN, so
		// without this a library administrator gets the form and a publish that can only
		// be refused.
		const roles = (auth.user?.profile?.roles as string[]) ?? [];
		if (!roles.includes("ADMIN") && !roles.includes("CONSORTIUM_ADMIN")) {
			throw redirect({ to: "/unauthorised" });
		}
	},
	component: ConsortiumAnnouncementsPage,
});

/** A fortnight. Long enough for an outage, short enough to be noticed when it lapses. */
const DEFAULT_DAYS = 14;

interface AnnouncementRow {
	id: string;
	headline: string;
	body: string;
	urgent: boolean;
	dismissible: boolean;
	startsAt: string;
	expiresAt: string;
}

function ConsortiumAnnouncementsPage() {
	const { t } = useTranslation();
	const client = useGraphQLClient();
	const queryClient = useQueryClient();
	const isConsortiumAdmin = useIsConsortiumAdmin();

	// The shared factory, not a second useQuery over the same operation: this page asked
	// for it under its own key, which is a second cache entry for one record and a second
	// staleTime to keep in step. See @queryOptions/libraries for the same lesson.
	const basics = useQuery(consortiumBasicsQuery(client));

	const consortium = basics.data?.consortia?.content?.[0];
	const scopeId = consortium?.id as string | undefined;

	// The member-library count, from the query that already exists for it. NOT from
	// consortium.libraryGroup: getConsortiaDataFetcher does no join on that association, so
	// asking it for anything but `id` returns null, and because the field is non-null the
	// null propagates and wipes the whole response. getConsortiumBasics carries a comment
	// about exactly that, and it took the header down once already.
	const libraryCount = useQuery(libraryCountQuery(client));

	const listKey = ["LoadAnnouncements", scopeId];

	const announcements = useQuery({
		queryKey: listKey,
		// The scope is the consortium's id; asking at `undefined` is a request that can only
		// fail.
		enabled: Boolean(scopeId),
		// Every publish and delete on this page invalidates listKey explicitly, so the
		// only thing a shorter window buys is a refetch each time the tab is remounted.
		staleTime: 1000 * 30,
		queryFn: () =>
			client.request<any>(getAnnouncements(), {
				scopeType: "CONSORTIUM",
				scopeId,
			}),
	});

	const publish = useMutation({
		// Typed variables, per the repo's own lint rule: `any` here hides a missing required
		// input field until a librarian meets it at runtime, and CreateAnnouncementInput has
		// five of them.
		mutationFn: (input: CreateAnnouncementMutationVariables["input"]) =>
			client.request<CreateAnnouncementMutation, CreateAnnouncementMutationVariables>(
				createAnnouncementQuery(),
				{ input },
			),
		onSuccess: () => {
			setConfirming(false);
			return queryClient.invalidateQueries({ queryKey: listKey });
		},
	});

	const withdraw = useMutation({
		mutationFn: (id: string) =>
			client.request<DeleteAnnouncementMutation, DeleteAnnouncementMutationVariables>(
				deleteAnnouncementQuery(),
				{ input: { id, reason: "Withdrawn from DCB Admin" } },
			),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: listKey }),
	});

	const [headline, setHeadline] = useState("");
	const [body, setBody] = useState("");
	const [urgent, setUrgent] = useState(false);
	const [dismissible, setDismissible] = useState(true);
	const [expiresAt, setExpiresAt] = useState(defaultExpiry());
	const [confirming, setConfirming] = useState(false);

	const rows: AnnouncementRow[] = announcements.data?.announcements ?? [];
	const memberLibraries = libraryCount.data;

	const ready =
		headline.trim().length > 0 && body.trim().length > 0 && Boolean(scopeId);

	// The second half of the guard, for the cold load beforeLoad cannot see - the roles
	// are not there yet when it runs. The form is never rendered.
	if (!isConsortiumAdmin) {
		return (
			<PageContainer hideTitleBox hideBreadcrumbs>
				<ErrorComponent
					title={t("ui.error.401.name")}
					message={t("ui.error.401.summary")}
					description={t("ui.error.401.description")}
					action={t("ui.error.401.action")}
					goBack="/consortium"
				/>
			</PageContainer>
		);
	}

	return (
		<PageContainer title={t("nav.consortium.announcements")}>
			<ConsortiumTabs current="announcements" />

			<Grid container spacing={3} columns={{ xs: 4, sm: 8, md: 12 }} sx={{ mt: 1 }}>
				<Grid size={{ xs: 4, sm: 8, md: 12 }}>
					<Typography color="text.secondary">
						{t("consortium.announcements.scope_help")}
					</Typography>
				</Grid>

				{publish.isError && (
					<Grid size={{ xs: 4, sm: 8, md: 12 }}>
						{/* dcb-service writes its refusals for a person. Shown as-is: the whole
						    argument for validating on the server is undone if the administrator
						    is told only that it failed. */}
						<Alert severity="error">{String(publish.error)}</Alert>
					</Grid>
				)}

				<Grid size={{ xs: 4, sm: 8, md: 6 }}>
					<Stack spacing={2}>
						<TextField
							label={t("consortium.announcements.headline")}
							value={headline}
							onChange={(event) => setHeadline(event.target.value)}
							slotProps={{ htmlInput: { maxLength: 200 } }}
							required
						/>
						<TextField
							label={t("consortium.announcements.body")}
							helperText={t("consortium.announcements.body_help")}
							value={body}
							onChange={(event) => setBody(event.target.value)}
							slotProps={{ htmlInput: { maxLength: 1000 } }}
							multiline
							minRows={3}
							required
						/>
						<TextField
							type="date"
							label={t("consortium.announcements.expires")}
							helperText={t("consortium.announcements.expires_help")}
							value={expiresAt}
							onChange={(event) => setExpiresAt(event.target.value)}
							slotProps={{ inputLabel: { shrink: true } }}
							required
						/>
						<FormControlLabel
							control={
								<Switch
									checked={urgent}
									onChange={(event) => setUrgent(event.target.checked)}
								/>
							}
							label={t("consortium.announcements.urgent")}
						/>
						<Typography variant="body2" color="text.secondary">
							{t("consortium.announcements.urgent_help")}
						</Typography>
						<FormControlLabel
							control={
								<Switch
									checked={dismissible}
									onChange={(event) => setDismissible(event.target.checked)}
								/>
							}
							label={t("consortium.announcements.dismissible")}
						/>
						<Button
							variant="contained"
							disabled={!ready || publish.isPending}
							onClick={() => setConfirming(true)}
						>
							{t("consortium.announcements.publish")}
						</Button>
					</Stack>
				</Grid>

				<Grid size={{ xs: 4, sm: 8, md: 6 }}>
					<Typography variant="h3" gutterBottom>
						{t("consortium.announcements.current")}
					</Typography>

					{rows.length === 0 ? (
						<Typography color="text.secondary">
							{t("consortium.announcements.none")}
						</Typography>
					) : (
						<Stack spacing={2}>
							{rows.map((row) => (
								<Stack key={row.id} spacing={0.5}>
									<Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
										<Typography variant="subtitle1">{row.headline}</Typography>
										{row.urgent && (
											<Chip
												size="small"
												color="warning"
												label={t("consortium.announcements.urgent")}
											/>
										)}
										{/* An expired notice stays listed: "why has that gone" is
										    the next question an administrator asks. */}
										{new Date(row.expiresAt) <= new Date() && (
											<Chip
												size="small"
												label={t("consortium.announcements.expired")}
											/>
										)}
									</Stack>
									<Typography variant="body2">{row.body}</Typography>
									<Typography variant="caption" color="text.secondary">
										{t("consortium.announcements.until", { date: row.expiresAt })}
									</Typography>
									<Button
										size="small"
										onClick={() => withdraw.mutate(row.id)}
										disabled={withdraw.isPending}
										sx={{ alignSelf: "flex-start", minHeight: 24 }}
									>
										{t("consortium.announcements.withdraw")}
									</Button>
								</Stack>
							))}
						</Stack>
					)}
				</Grid>
			</Grid>

			<Dialog
				open={confirming}
				onClose={() => setConfirming(false)}
				aria-labelledby="confirm-announcement-title"
			>
				<DialogTitle id="confirm-announcement-title">
					{t("consortium.announcements.confirm_title")}
				</DialogTitle>
				<DialogContent>
					<DialogContentText>
						{/* The reach, named. A dialog that does not say what it is confirming is
						    one people learn to click through without reading — which is worse
						    than no dialog, because it feels like a control. */}
						{t("consortium.announcements.confirm_body", {
							libraries: memberLibraries ?? "?",
						})}
					</DialogContentText>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setConfirming(false)}>
						{t("consortium.announcements.cancel")}
					</Button>
					<Button
						variant="contained"
						disabled={publish.isPending}
						onClick={() =>
							publish.mutate({
								scopeType: "CONSORTIUM",
								// Non-null because `ready` gates the button on it, and the dialog
								// cannot open without the button.
								scopeId: scopeId!,
								headline: headline.trim(),
								body: body.trim(),
								urgent,
								dismissible,
								startsAt: new Date().toISOString(),
								expiresAt: endOfDay(expiresAt),
							})
						}
					>
						{t("consortium.announcements.confirm_publish")}
					</Button>
				</DialogActions>
			</Dialog>
		</PageContainer>
	);
}

/** `yyyy-mm-dd`, which is what a native date input reads and writes. */
function defaultExpiry(): string {
	const when = new Date();
	when.setDate(when.getDate() + DEFAULT_DAYS);
	return when.toISOString().slice(0, 10);
}

/**
 * The end of the chosen day rather than its midnight.
 *
 * An administrator choosing the 30th means "up to and including the 30th"; sending midnight
 * would take the notice down a day early, on the day they thought it would still be up.
 */
function endOfDay(date: string): string {
	return new Date(`${date}T23:59:59.000Z`).toISOString();
}
