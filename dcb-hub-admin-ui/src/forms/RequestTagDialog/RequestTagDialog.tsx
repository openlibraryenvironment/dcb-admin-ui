import { useTranslation } from "react-i18next";
import { Controller, useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { yupResolver } from "@hookform/resolvers/yup";
import {
	Alert,
	Box,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Divider,
	TextField,
} from "@mui/material";

import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { describeGraphQLError } from "@helpers/graphQLErrors";
import { createRequestTag, updateRequestTag } from "@mutations/requestTags";
import { REQUEST_TAGS_QUERY_KEY } from "@/queryOptions/requestTags";
import {
	buildRequestTagSchema,
	REQUEST_TAG_DESCRIPTION_MAX,
	REQUEST_TAG_LABEL_MAX,
	RequestTagFormData,
} from "@schemas/requestTagSchema";
import type {
	CreateRequestTagMutation,
	CreateRequestTagMutationVariables,
	UpdateRequestTagMutation,
	UpdateRequestTagMutationVariables,
} from "@generated/graphql";

export interface EditableRequestTag {
	code: string;
	label: string;
	description?: string | null;
}

interface RequestTagDialogProps {
	/** The tag being edited, or absent to add one. */
	tag?: EditableRequestTag;
	onClose: () => void;
	onSaved: (label: string) => void;
}

export default function RequestTagDialog({
	tag,
	onClose,
	onSaved,
}: RequestTagDialogProps) {
	const { t } = useTranslation();
	const gqlClient = useGraphQLClient();
	const queryClient = useQueryClient();
	const editing = Boolean(tag);

	const {
		control,
		handleSubmit,
		formState: { errors, isValid, isSubmitting },
	} = useForm<RequestTagFormData>({
		defaultValues: {
			code: tag?.code ?? "",
			label: tag?.label ?? "",
			description: tag?.description ?? "",
		},
		resolver: yupResolver(buildRequestTagSchema(t)) as never,
		mode: "onChange",
	});

	const save = useMutation<
		CreateRequestTagMutation | UpdateRequestTagMutation,
		Error,
		RequestTagFormData
	>({
		mutationFn: (data) => {
			const input = {
				code: data.code.trim(),
				label: data.label.trim(),
				// Sent explicitly, so emptying the field clears the stored description
				description: data.description.trim() || null,
			};

			return editing
				? gqlClient.request<
						UpdateRequestTagMutation,
						UpdateRequestTagMutationVariables
					>(updateRequestTag, { input })
				: gqlClient.request<
						CreateRequestTagMutation,
						CreateRequestTagMutationVariables
					>(createRequestTag, { input });
		},
		onSuccess: (_result, data) => {
			queryClient.invalidateQueries({ queryKey: REQUEST_TAGS_QUERY_KEY });
			onSaved(data.label.trim());
		},
	});

	return (
		<Dialog
			open
			onClose={onClose}
			fullWidth
			maxWidth="sm"
			aria-labelledby="request-tag-dialog-title"
		>
			<DialogTitle id="request-tag-dialog-title" variant="modalTitle">
				{editing
					? t("consortium.request_tags.edit_named", { label: tag?.label })
					: t("consortium.request_tags.add")}
			</DialogTitle>
			<Divider aria-hidden="true" />
			<DialogContent>
				{save.isError && (
					<Alert severity="error" sx={{ mb: 2 }}>
						{describeGraphQLError(
							save.error,
							t("consortium.request_tags.save_failed"),
						)}
					</Alert>
				)}
				<Box
					component="form"
					id="request-tag-form"
					onSubmit={handleSubmit((data) => save.mutate(data))}
					sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}
				>
					<Controller
						name="label"
						control={control}
						render={({ field }) => (
							<TextField
								{...field}
								label={t("consortium.request_tags.label")}
								fullWidth
								required
								error={!!errors.label}
								helperText={
									errors.label?.message ??
									t("consortium.request_tags.label_help")
								}
								aria-invalid={!!errors.label}
								slotProps={{ htmlInput: { maxLength: REQUEST_TAG_LABEL_MAX } }}
							/>
						)}
					/>
					<Controller
						name="code"
						control={control}
						render={({ field }) => (
							<TextField
								{...field}
								label={t("consortium.request_tags.code")}
								fullWidth
								required
								// Read-only once the tag exists: tags on requests refer to it by code
								disabled={editing}
								error={!!errors.code}
								helperText={
									errors.code?.message ??
									t(
										editing
											? "consortium.request_tags.code_fixed"
											: "consortium.request_tags.code_help",
									)
								}
								aria-invalid={!!errors.code}
								onChange={(event) =>
									field.onChange(event.target.value.toUpperCase())
								}
							/>
						)}
					/>
					<Controller
						name="description"
						control={control}
						render={({ field }) => (
							<TextField
								{...field}
								label={t("consortium.request_tags.description")}
								fullWidth
								multiline
								minRows={2}
								error={!!errors.description}
								helperText={
									errors.description?.message ??
									t("consortium.request_tags.description_help")
								}
								aria-invalid={!!errors.description}
								slotProps={{
									htmlInput: { maxLength: REQUEST_TAG_DESCRIPTION_MAX },
								}}
							/>
						)}
					/>
				</Box>
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose}>{t("ui.actions.cancel")}</Button>
				<Button
					type="submit"
					form="request-tag-form"
					variant="contained"
					disabled={!isValid || isSubmitting || save.isPending}
				>
					{editing
						? t("consortium.request_tags.save")
						: t("consortium.request_tags.add")}
				</Button>
			</DialogActions>
		</Dialog>
	);
}
