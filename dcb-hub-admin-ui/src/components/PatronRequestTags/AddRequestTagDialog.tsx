import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	Alert,
	Button,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	MenuItem,
	Skeleton,
	Stack,
	TextField,
	Typography,
} from "@mui/material";

import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { describeGraphQLError } from "@helpers/graphQLErrors";
import { nonCriticalQuery } from "@helpers/queryPolicy";
import { tagPatronRequest } from "@mutations/patronRequestTags";
import {
	patronRequestNoteKeys,
	patronRequestTagsQuery,
} from "@/queryOptions/patronRequestNotesAndTags";
import { requestTagsQuery } from "@/queryOptions/requestTags";
import { appliedTags } from "@helpers/requestTags";
import type {
	TagPatronRequestMutation,
	TagPatronRequestMutationVariables,
} from "@generated/graphql";

const TITLE_ID = "add-request-tag-title";
const FORM_ID = "add-request-tag-form";

interface AddTagFormData {
	tagCode: string;
}

/** Applies one of the consortium's active tags to a request, and says in place that it did. */
export default function AddRequestTagDialog({
	patronRequestId,
	onClose,
}: {
	patronRequestId: string;
	onClose: () => void;
}) {
	const { t } = useTranslation();
	const gqlClient = useGraphQLClient();
	const queryClient = useQueryClient();

	const tags = useQuery({
		...patronRequestTagsQuery(gqlClient, patronRequestId),
		...nonCriticalQuery,
	});
	const vocabulary = useQuery({
		...requestTagsQuery(gqlClient),
		...nonCriticalQuery,
	});

	const appliedByConsortium = new Set(
		appliedTags(tags.data?.patronRequests?.content?.[0]?.tags)
			.filter((tag) => tag.consortium)
			.map((tag) => tag.code),
	);
	// dcb-service refuses a retired tag, so only active ones are offered
	const activeTags = (vocabulary.data?.requestTags ?? []).flatMap((tag) =>
		tag?.code && tag.active
			? [{ code: tag.code, label: tag.label ?? tag.code }]
			: [],
	);
	const options = activeTags.filter(
		(tag) => !appliedByConsortium.has(tag.code),
	);

	const {
		control,
		handleSubmit,
		formState: { errors },
	} = useForm<AddTagFormData>({
		defaultValues: { tagCode: "" },
		resolver: yupResolver(
			Yup.object({
				tagCode: Yup.string().required(
					t("ui.validation.required", {
						field: t("patron_request.tags.tag"),
					}),
				),
			}),
		),
	});

	const add = useMutation({
		mutationFn: (tagCode: string) =>
			gqlClient.request<
				TagPatronRequestMutation,
				TagPatronRequestMutationVariables
			>(tagPatronRequest, { patronRequestId, tagCode }),
		onSuccess: () =>
			queryClient.invalidateQueries({
				queryKey: patronRequestNoteKeys.tags(patronRequestId),
			}),
	});

	const added = add.isSuccess ? add.variables : undefined;
	const addedLabel =
		activeTags.find((tag) => tag.code === added)?.label ?? added;

	const close = () => {
		if (!add.isPending) onClose();
	};
	// The focused Add button unmounts when the outcome replaces it (WCAG 2.4.3)
	const closeButton = useRef<HTMLButtonElement>(null);
	useEffect(() => {
		if (added) closeButton.current?.focus();
	}, [added]);

	const body = () => {
		if (vocabulary.isPending) return <Skeleton variant="rounded" height={56} />;
		if (vocabulary.isError)
			return (
				<Alert severity="error">
					{describeGraphQLError(
						vocabulary.error,
						t("patron_request.tags.vocabulary_failed"),
					)}
				</Alert>
			);
		if (activeTags.length === 0)
			return (
				<Typography variant="body2">
					{t("patron_request.tags.vocabulary_empty")}
				</Typography>
			);
		if (options.length === 0)
			return (
				<Typography variant="body2">
					{t("patron_request.tags.all_applied")}
				</Typography>
			);
		return (
			<form
				id={FORM_ID}
				noValidate
				onSubmit={handleSubmit((data) => add.mutate(data.tagCode))}
			>
				<Controller
					name="tagCode"
					control={control}
					render={({ field: { ref, ...field } }) => (
						<TextField
							{...field}
							inputRef={ref}
							select
							fullWidth
							id="add-request-tag-code"
							label={t("patron_request.tags.tag")}
							required
							error={!!errors.tagCode}
							helperText={errors.tagCode?.message}
						>
							{options.map((tag) => (
								<MenuItem key={tag.code} value={tag.code}>
									{tag.label}
								</MenuItem>
							))}
						</TextField>
					)}
				/>
			</form>
		);
	};

	const canAdd =
		!vocabulary.isPending && !vocabulary.isError && options.length > 0;

	return (
		<Dialog
			open
			onClose={close}
			aria-labelledby={TITLE_ID}
			fullWidth
			maxWidth="sm"
		>
			<DialogTitle id={TITLE_ID}>
				{t("patron_request.tags.add_title")}
			</DialogTitle>
			<DialogContent>
				<Stack spacing={2} sx={{ pt: 1 }}>
					{!added && body()}
					<div role="status" aria-live="polite">
						{added && (
							<Alert severity="success">
								{t("patron_request.tags.added", { label: addedLabel })}
							</Alert>
						)}
						{add.isError && (
							<Alert severity="error">
								{describeGraphQLError(
									add.error,
									t("patron_request.tags.add_failed"),
								)}
							</Alert>
						)}
					</div>
				</Stack>
			</DialogContent>
			<DialogActions>
				{added ? (
					<Button ref={closeButton} onClick={onClose} variant="contained">
						{t("ui.actions.close")}
					</Button>
				) : (
					<>
						<Button onClick={onClose} disabled={add.isPending}>
							{t("ui.actions.cancel")}
						</Button>
						{canAdd && (
							<Button
								type="submit"
								form={FORM_ID}
								variant="contained"
								disabled={add.isPending}
								startIcon={
									add.isPending ? (
										<CircularProgress size="1rem" aria-hidden />
									) : undefined
								}
							>
								{t("patron_request.tags.add")}
							</Button>
						)}
					</>
				)}
			</DialogActions>
		</Dialog>
	);
}
