import { useTranslation } from "react-i18next";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Skeleton, Stack, Typography } from "@mui/material";

import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { nonCriticalQuery } from "@helpers/queryPolicy";
import {
	isRequestNotesEnabled,
	isRequestTagsEnabled,
} from "@helpers/featureFlags";
import { appliedTags } from "@helpers/requestTags";
import {
	patronRequestNotesQuery,
	patronRequestTagsQuery,
} from "@/queryOptions/patronRequestNotesAndTags";
import TagList from "@components/TagChip/TagChip";
import { CustomLink } from "@components/CustomLink/CustomLink";

/**
 * A request's tags, and a link to its notes, in a grid row's detail panel. Fetched only
 * when the panel is open: one request each, per row someone expands.
 */
export default function RequestTagsAndNotes({
	patronRequestId,
}: {
	patronRequestId: string;
}) {
	const { t } = useTranslation();
	const gqlClient = useGraphQLClient();

	const tags = useQuery({
		...patronRequestTagsQuery(gqlClient, patronRequestId),
		...nonCriticalQuery,
		enabled: isRequestTagsEnabled(),
	});
	// The page the request's Notes tab reads first, so opening it costs nothing more
	const notes = useInfiniteQuery({
		...patronRequestNotesQuery(gqlClient, patronRequestId),
		...nonCriticalQuery,
		enabled: isRequestNotesEnabled(),
	});

	const applied = appliedTags(tags.data?.patronRequests?.content?.[0]?.tags);
	const noteCount =
		notes.data?.pages[0]?.patronRequests?.content?.[0]?.notes?.totalSize ?? 0;

	return (
		<Stack
			direction="row"
			spacing={2}
			useFlexGap
			sx={{ alignItems: "center", flexWrap: "wrap" }}
		>
			{isRequestTagsEnabled() && (
				<Stack
					direction="row"
					spacing={1}
					useFlexGap
					sx={{ alignItems: "center", flexWrap: "wrap" }}
				>
					<Typography variant="attributeTitle" component="span">
						{t("patron_request.tags.title")}
					</Typography>
					{tags.isLoading ? (
						<Skeleton variant="rounded" width={160} height={24} />
					) : tags.isError ? (
						<Typography variant="body2">
							{t("patron_request.tags.load_failed")}
						</Typography>
					) : applied.length === 0 ? (
						<Typography variant="body2">
							{t("patron_request.tags.none_short")}
						</Typography>
					) : (
						<TagList tags={applied} label={t("patron_request.tags.title")} />
					)}
				</Stack>
			)}
			{isRequestNotesEnabled() && (
				<CustomLink
					to="/patronRequests/$id"
					params={{ id: patronRequestId }}
					search={{ tab: "notes" }}
					underline="hover"
					variant="body2"
					// The row would otherwise take the click as its own and open the request on General
					onClick={(event: React.MouseEvent) => event.stopPropagation()}
				>
					{notes.isLoading
						? t("patron_request.notes.title")
						: t("patron_request.notes.link", { count: noteCount })}
				</CustomLink>
			)}
		</Stack>
	);
}
