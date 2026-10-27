import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	Alert,
	Box,
	Button,
	Chip,
	List,
	ListItem,
	MenuItem,
	Skeleton,
	Stack,
	TextField,
	Typography,
} from "@mui/material";

import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { describeGraphQLError } from "@helpers/graphQLErrors";
import { nonCriticalQuery } from "@helpers/queryPolicy";
import {
	tagPatronRequest,
	untagPatronRequest,
} from "@mutations/patronRequestTags";
import {
	patronRequestNoteKeys,
	patronRequestTagsQuery,
} from "@/queryOptions/patronRequestNotesAndTags";
import { requestTagsQuery } from "@/queryOptions/requestTags";
import type {
	TagPatronRequestMutation,
	TagPatronRequestMutationVariables,
	UntagPatronRequestMutation,
	UntagPatronRequestMutationVariables,
} from "@generated/graphql";

interface AppliedTag {
	code: string;
	label: string;
	consortium: boolean;
	agencyCodes: string[];
}

interface AddTagFormData {
	tagCode: string;
}

interface PatronRequestTagsProps {
	patronRequestId: string;
}

/** The tags on one patron request, and the consortium's own applications of them. */
export default function PatronRequestTags({
	patronRequestId,
}: PatronRequestTagsProps) {
	const { t } = useTranslation();
	const gqlClient = useGraphQLClient();
	const queryClient = useQueryClient();

	const [notice, setNotice] = useState<string | null>(null);

	const tags = useQuery({
		...patronRequestTagsQuery(gqlClient, patronRequestId),
		...nonCriticalQuery,
	});
	const vocabulary = useQuery({
		...requestTagsQuery(gqlClient),
		...nonCriticalQuery,
	});

	const applied: AppliedTag[] = (
		tags.data?.patronRequests?.content?.[0]?.tags ?? []
	).flatMap((tag) =>
		tag?.code
			? [
					{
						code: tag.code,
						label: tag.label ?? tag.code,
						consortium: tag.consortium === true,
						agencyCodes: (tag.agencyCodes ?? []).flatMap((code) =>
							code ? [code] : [],
						),
					},
				]
			: [],
	);
	const appliedByConsortium = new Set(
		applied.filter((tag) => tag.consortium).map((tag) => tag.code),
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
		reset,
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

	const labelOf = (code: string) =>
		activeTags.find((tag) => tag.code === code)?.label ??
		applied.find((tag) => tag.code === code)?.label ??
		code;

	const add = useMutation({
		mutationFn: (tagCode: string) =>
			gqlClient.request<
				TagPatronRequestMutation,
				TagPatronRequestMutationVariables
			>(tagPatronRequest, { patronRequestId, tagCode }),
		onSuccess: (_result, tagCode) => {
			reset();
			setNotice(t("patron_request.tags.added", { label: labelOf(tagCode) }));
			return queryClient.invalidateQueries({
				queryKey: patronRequestNoteKeys.tags(patronRequestId),
			});
		},
	});

	const remove = useMutation({
		mutationFn: (tag: AppliedTag) =>
			gqlClient.request<
				UntagPatronRequestMutation,
				UntagPatronRequestMutationVariables
			>(untagPatronRequest, { patronRequestId, tagCode: tag.code }),
		onSuccess: (_result, tag) => {
			setNotice(t("patron_request.tags.removed", { label: tag.label }));
			return queryClient.invalidateQueries({
				queryKey: patronRequestNoteKeys.tags(patronRequestId),
			});
		},
	});

	const appliedBy = (tag: AppliedTag) =>
		[
			...(tag.consortium ? [t("patron_request.tags.consortium")] : []),
			...tag.agencyCodes,
		].join(", ");

	return (
		<Stack spacing={2}>
			<Typography variant="accordionSummary" component="h2">
				{t("patron_request.tags.title")}
			</Typography>
			<Typography variant="body2">
				{t("patron_request.tags.explanation")}
			</Typography>

			{tags.isLoading ? (
				<Skeleton variant="rounded" height={40} />
			) : tags.isError ? (
				<Alert severity="error">
					{describeGraphQLError(
						tags.error,
						t("patron_request.tags.load_failed"),
					)}
				</Alert>
			) : applied.length === 0 ? (
				<Typography>{t("patron_request.tags.none")}</Typography>
			) : (
				<List disablePadding>
					{applied.map((tag) => (
						<ListItem key={tag.code} disableGutters>
							<Stack
								direction="row"
								spacing={1}
								sx={{ alignItems: "center", flexWrap: "wrap" }}
							>
								<Chip label={tag.label} />
								<Typography variant="body2">
									{t("patron_request.tags.applied_by", {
										who: appliedBy(tag),
									})}
								</Typography>
								{tag.consortium && (
									<Button
										size="small"
										aria-label={t("patron_request.tags.remove_named", {
											label: tag.label,
										})}
										disabled={remove.isPending}
										onClick={() => remove.mutate(tag)}
									>
										{t("patron_request.tags.remove")}
									</Button>
								)}
							</Stack>
						</ListItem>
					))}
				</List>
			)}

			{remove.isError && (
				<Alert severity="error">
					{describeGraphQLError(
						remove.error,
						t("patron_request.tags.remove_failed"),
					)}
				</Alert>
			)}

			{/* Not rendered until the list is in: a button drawn disabled and then enabled fades,
			    and axe sampled it mid-fade */}
			{vocabulary.isPending ? (
				<Skeleton variant="rounded" height={56} />
			) : vocabulary.isError ? (
				<Alert severity="error">
					{describeGraphQLError(
						vocabulary.error,
						t("patron_request.tags.vocabulary_failed"),
					)}
				</Alert>
			) : activeTags.length === 0 ? (
				<Typography variant="body2">
					{t("patron_request.tags.vocabulary_empty")}
				</Typography>
			) : options.length === 0 ? (
				<Typography variant="body2">
					{t("patron_request.tags.all_applied")}
				</Typography>
			) : (
				<Box
					component="form"
					noValidate
					aria-label={t("patron_request.tags.add")}
					onSubmit={handleSubmit((data) => add.mutate(data.tagCode))}
				>
					<Stack
						direction={{ xs: "column", sm: "row" }}
						spacing={1}
						sx={{ alignItems: { sm: "center" } }}
					>
						<Controller
							name="tagCode"
							control={control}
							render={({ field }) => (
								<TextField
									{...field}
									select
									label={t("patron_request.tags.tag")}
									required
									sx={{ minWidth: (theme) => theme.spacing(30) }}
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
						<Button type="submit" variant="contained" disabled={add.isPending}>
							{t("patron_request.tags.add")}
						</Button>
					</Stack>
				</Box>
			)}

			{add.isError && (
				<Alert severity="error">
					{describeGraphQLError(add.error, t("patron_request.tags.add_failed"))}
				</Alert>
			)}

			<Typography variant="body2" role="status" aria-live="polite">
				{notice}
			</Typography>
		</Stack>
	);
}
