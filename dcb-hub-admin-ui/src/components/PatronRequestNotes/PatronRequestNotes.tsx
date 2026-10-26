import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Controller, useForm, useWatch } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import {
	useInfiniteQuery,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import {
	Alert,
	Box,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
	List,
	ListItem,
	Skeleton,
	Stack,
	TextField,
	Typography,
} from "@mui/material";

import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { useLocaleStore } from "@hooks/useLocaleStore";
import { describeGraphQLError } from "@helpers/graphQLErrors";
import { nonCriticalQuery } from "@helpers/queryPolicy";
import { deploymentLocale, resolveFormatLocale } from "@helpers/locale";
import {
	addPatronRequestNote,
	retractPatronRequestNote,
} from "@mutations/patronRequestNotes";
import {
	patronRequestNoteKeys,
	patronRequestNotesQuery,
} from "@/queryOptions/patronRequestNotesAndTags";
import {
	buildPatronRequestNoteSchema,
	PATRON_REQUEST_NOTE_MAX,
	PatronRequestNoteFormData,
} from "@schemas/patronRequestNoteSchema";
import type {
	AddPatronRequestNoteMutation,
	AddPatronRequestNoteMutationVariables,
	RetractPatronRequestNoteMutation,
	RetractPatronRequestNoteMutationVariables,
} from "@generated/graphql";

interface ShownNote {
	id: string;
	author: string;
	date: string;
	body: string;
	retracted: boolean;
	retractedBy: string | null;
}

interface PatronRequestNotesProps {
	patronRequestId: string;
}

/** The notes on one patron request: newest first, a page at a time, add and retract. */
export default function PatronRequestNotes({
	patronRequestId,
}: PatronRequestNotesProps) {
	const { t } = useTranslation();
	const gqlClient = useGraphQLClient();
	const queryClient = useQueryClient();
	const choice = useLocaleStore((s) => s.choice);

	const [notice, setNotice] = useState<string | null>(null);
	const [retracting, setRetracting] = useState<ShownNote | null>(null);

	const notes = useInfiniteQuery({
		...patronRequestNotesQuery(gqlClient, patronRequestId),
		...nonCriticalQuery,
	});

	const dateTime = new Intl.DateTimeFormat(
		resolveFormatLocale(choice, deploymentLocale()),
		{ dateStyle: "medium", timeStyle: "short" },
	);

	const shown: ShownNote[] = (notes.data?.pages ?? [])
		.flatMap((page) => page.patronRequests?.content?.[0]?.notes?.content ?? [])
		.flatMap((note) =>
			note?.id
				? [
						{
							id: note.id,
							author:
								note.authorKind === "CONSORTIUM"
									? t("patron_request.notes.by_consortium")
									: (note.libraryName ??
										note.agencyCode ??
										t("patron_request.notes.by_unknown_library")),
							date: note.dateCreated
								? dateTime.format(new Date(note.dateCreated))
								: "",
							body: note.body ?? "",
							retracted: note.retracted === true,
							retractedBy: note.retractedBy,
						},
					]
				: [],
		);
	const total =
		notes.data?.pages[0]?.patronRequests?.content?.[0]?.notes?.totalSize ?? 0;

	const {
		control,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<PatronRequestNoteFormData>({
		defaultValues: { body: "" },
		resolver: yupResolver(buildPatronRequestNoteSchema(t)) as never,
	});
	const body = useWatch({ control, name: "body" });

	const add = useMutation({
		mutationFn: (text: string) =>
			gqlClient.request<
				AddPatronRequestNoteMutation,
				AddPatronRequestNoteMutationVariables
			>(addPatronRequestNote, { patronRequestId, body: text }),
		onSuccess: () => {
			reset();
			setNotice(t("patron_request.notes.added"));
			return queryClient.invalidateQueries({
				queryKey: patronRequestNoteKeys.notes(patronRequestId),
			});
		},
	});

	const retract = useMutation({
		mutationFn: (note: ShownNote) =>
			gqlClient.request<
				RetractPatronRequestNoteMutation,
				RetractPatronRequestNoteMutationVariables
			>(retractPatronRequestNote, { id: note.id }),
		onSuccess: () => {
			setRetracting(null);
			setNotice(t("patron_request.notes.retracted"));
			return queryClient.invalidateQueries({
				queryKey: patronRequestNoteKeys.notes(patronRequestId),
			});
		},
	});

	return (
		<Stack spacing={2}>
			<Typography variant="accordionSummary" component="h2">
				{t("patron_request.notes.title")}
			</Typography>
			<Typography variant="body2">
				{t("patron_request.notes.explanation")}
			</Typography>

			<Box
				component="form"
				noValidate
				aria-label={t("patron_request.notes.add")}
				onSubmit={handleSubmit((data) => add.mutate(data.body.trim()))}
			>
				<Stack spacing={1} sx={{ alignItems: "flex-start" }}>
					<Controller
						name="body"
						control={control}
						render={({ field }) => (
							<TextField
								{...field}
								label={t("patron_request.notes.body")}
								multiline
								minRows={3}
								fullWidth
								required
								error={!!errors.body}
								helperText={
									errors.body?.message ??
									t("patron_request.notes.body_help", {
										count: body.length,
										max: PATRON_REQUEST_NOTE_MAX,
									})
								}
							/>
						)}
					/>
					<Button type="submit" variant="contained" disabled={add.isPending}>
						{t("patron_request.notes.add")}
					</Button>
				</Stack>
			</Box>

			{add.isError && (
				<Alert severity="error">
					{describeGraphQLError(
						add.error,
						t("patron_request.notes.add_failed"),
					)}
				</Alert>
			)}

			<Typography variant="body2" role="status" aria-live="polite">
				{notice ?? t("patron_request.notes.count", { count: total })}
			</Typography>

			{notes.isLoading ? (
				<Skeleton variant="rounded" height={96} />
			) : notes.isError ? (
				<Alert severity="error">
					{describeGraphQLError(
						notes.error,
						t("patron_request.notes.load_failed"),
					)}
				</Alert>
			) : shown.length === 0 ? (
				<Typography>{t("patron_request.notes.none")}</Typography>
			) : (
				<List component="ol" disablePadding>
					{shown.map((note) => (
						<ListItem
							key={note.id}
							divider
							disableGutters
							sx={{ display: "block" }}
						>
							<Stack spacing={0.5}>
								<Typography variant="subtitle2" component="p">
									{t("patron_request.notes.written", {
										author: note.author,
										date: note.date,
									})}
								</Typography>
								<Typography
									sx={{
										whiteSpace: "pre-wrap",
										overflowWrap: "anywhere",
										color: note.retracted ? "text.secondary" : "text.primary",
									}}
								>
									{note.body}
								</Typography>
								{note.retracted ? (
									<Typography variant="body2" sx={{ fontStyle: "italic" }}>
										{t(
											note.retractedBy === "CONSORTIUM"
												? "patron_request.notes.retracted_by_consortium"
												: "patron_request.notes.retracted_by_library",
										)}
									</Typography>
								) : (
									<Box>
										<Button
											size="small"
											aria-label={t("patron_request.notes.retract_named", {
												author: note.author,
												date: note.date,
											})}
											onClick={() => {
												retract.reset();
												setRetracting(note);
											}}
										>
											{t("patron_request.notes.retract")}
										</Button>
									</Box>
								)}
							</Stack>
						</ListItem>
					))}
				</List>
			)}

			{notes.hasNextPage && (
				<Box>
					<Button
						onClick={() => notes.fetchNextPage()}
						disabled={notes.isFetchingNextPage}
					>
						{t("patron_request.notes.show_older")}
					</Button>
				</Box>
			)}

			<Dialog
				open={retracting !== null}
				onClose={() => setRetracting(null)}
				aria-labelledby="retract-note-title"
			>
				<DialogTitle id="retract-note-title">
					{t("patron_request.notes.retract_title")}
				</DialogTitle>
				<DialogContent>
					{retract.isError && (
						<Alert severity="error" sx={{ mb: 2 }}>
							{describeGraphQLError(
								retract.error,
								t("patron_request.notes.retract_failed"),
							)}
						</Alert>
					)}
					<DialogContentText>
						{t("patron_request.notes.retract_body")}
					</DialogContentText>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setRetracting(null)}>
						{t("ui.actions.cancel")}
					</Button>
					<Button
						variant="contained"
						color="error"
						disabled={retract.isPending}
						onClick={() => retracting && retract.mutate(retracting)}
					>
						{t("patron_request.notes.retract")}
					</Button>
				</DialogActions>
			</Dialog>
		</Stack>
	);
}
