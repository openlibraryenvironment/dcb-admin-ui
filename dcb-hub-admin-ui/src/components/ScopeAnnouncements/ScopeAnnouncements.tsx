import { useState } from "react";
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

import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { getAnnouncements } from "@queries/getAnnouncements";
import {
	createAnnouncementQuery,
	deleteAnnouncementQuery,
} from "@mutations/announcements";
import type {
	CreateAnnouncementMutation,
	CreateAnnouncementMutationVariables,
	DeleteAnnouncementMutation,
	DeleteAnnouncementMutationVariables,
} from "@generated/graphql";

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

export interface ScopeAnnouncementsProps {
	scopeType: "CONSORTIUM" | "LIBRARY_GROUP";
	/** Undefined until the scope has loaded; nothing is asked for or published before then. */
	scopeId: string | undefined;
	scopeHelp: string;
	publishLabel: string;
	confirmTitle: string;
	/** Names the reach: the confirmation is only worth having if it says who will see it. */
	confirmBody: string;
}

/**
 * Publishing and withdrawing the notices at one scope. Publishing asks once more, naming the
 * reach, because a notice at this scope reaches every patron of many libraries.
 */
export default function ScopeAnnouncements({
	scopeType,
	scopeId,
	scopeHelp,
	publishLabel,
	confirmTitle,
	confirmBody,
}: ScopeAnnouncementsProps) {
	const { t } = useTranslation();
	const client = useGraphQLClient();
	const queryClient = useQueryClient();

	const listKey = ["LoadAnnouncements", scopeType, scopeId];

	const announcements = useQuery({
		queryKey: listKey,
		enabled: Boolean(scopeId),
		// Every publish and withdrawal here invalidates listKey explicitly
		staleTime: 1000 * 30,
		queryFn: () =>
			client.request<any>(getAnnouncements(), { scopeType, scopeId }),
	});

	const publish = useMutation({
		mutationFn: (input: CreateAnnouncementMutationVariables["input"]) =>
			client.request<
				CreateAnnouncementMutation,
				CreateAnnouncementMutationVariables
			>(createAnnouncementQuery(), { input }),
		onSuccess: () => {
			setConfirming(false);
			return queryClient.invalidateQueries({ queryKey: listKey });
		},
	});

	const withdraw = useMutation({
		mutationFn: (id: string) =>
			client.request<
				DeleteAnnouncementMutation,
				DeleteAnnouncementMutationVariables
			>(deleteAnnouncementQuery(), {
				input: { id, reason: "Withdrawn from DCB Admin" },
			}),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: listKey }),
	});

	const [headline, setHeadline] = useState("");
	const [body, setBody] = useState("");
	const [urgent, setUrgent] = useState(false);
	const [dismissible, setDismissible] = useState(true);
	const [expiresAt, setExpiresAt] = useState(defaultExpiry());
	const [confirming, setConfirming] = useState(false);

	const rows: AnnouncementRow[] = announcements.data?.announcements ?? [];

	const ready =
		headline.trim().length > 0 && body.trim().length > 0 && Boolean(scopeId);

	return (
		<>
			<Grid
				container
				spacing={3}
				columns={{ xs: 4, sm: 8, md: 12 }}
				sx={{ mt: 1 }}
			>
				<Grid size={{ xs: 4, sm: 8, md: 12 }}>
					<Typography color="text.secondary">{scopeHelp}</Typography>
				</Grid>

				{publish.isError && (
					<Grid size={{ xs: 4, sm: 8, md: 12 }}>
						{/* dcb-service writes its refusals for a person, so they are shown as-is */}
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
							{publishLabel}
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
									<Stack
										direction="row"
										spacing={1}
										sx={{ alignItems: "center" }}
									>
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
										{t("consortium.announcements.until", {
											date: row.expiresAt,
										})}
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
					{confirmTitle}
				</DialogTitle>
				<DialogContent>
					<DialogContentText>{confirmBody}</DialogContentText>
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
								scopeType,
								// Non-null: `ready` gates the button that opens this dialog on it
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
		</>
	);
}

/** `yyyy-mm-dd`, which is what a native date input reads and writes. */
function defaultExpiry(): string {
	const when = new Date();
	when.setDate(when.getDate() + DEFAULT_DAYS);
	return when.toISOString().slice(0, 10);
}

// The end of the chosen day: "show until the 30th" includes the 30th
function endOfDay(date: string): string {
	return new Date(`${date}T23:59:59.000Z`).toISOString();
}
