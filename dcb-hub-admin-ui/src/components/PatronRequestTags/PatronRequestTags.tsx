import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	Alert,
	Button,
	List,
	ListItem,
	Skeleton,
	Stack,
	Typography,
} from "@mui/material";

import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { describeGraphQLError } from "@helpers/graphQLErrors";
import { nonCriticalQuery } from "@helpers/queryPolicy";
import { untagPatronRequest } from "@mutations/patronRequestTags";
import {
	patronRequestNoteKeys,
	patronRequestTagsQuery,
} from "@/queryOptions/patronRequestNotesAndTags";
import { TagChip } from "@components/TagChip/TagChip";
import {
	appliedTags,
	REQUEST_TAGS_SECTION_ID,
	type AppliedTag,
} from "@helpers/requestTags";
import type {
	UntagPatronRequestMutation,
	UntagPatronRequestMutationVariables,
} from "@generated/graphql";

interface PatronRequestTagsProps {
	patronRequestId: string;
}

/** The tags on one patron request; the consortium may remove its own. Adding is in Actions. */
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

	const applied = appliedTags(tags.data?.patronRequests?.content?.[0]?.tags);

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
			<Typography
				variant="accordionSummary"
				component="h2"
				id={REQUEST_TAGS_SECTION_ID}
				tabIndex={-1}
			>
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
								<TagChip tag={tag} />
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

			<Typography variant="body2" role="status" aria-live="polite">
				{notice}
			</Typography>
		</Stack>
	);
}
