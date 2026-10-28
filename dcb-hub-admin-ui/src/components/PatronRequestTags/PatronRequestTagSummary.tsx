import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Button, Skeleton, Stack, Typography } from "@mui/material";

import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { nonCriticalQuery } from "@helpers/queryPolicy";
import { patronRequestTagsQuery } from "@/queryOptions/patronRequestNotesAndTags";
import TagList from "@components/TagChip/TagChip";
import { appliedTags, REQUEST_TAGS_SECTION_ID } from "@helpers/requestTags";

/** A request's tags at the top of its page, with a way to the section that manages them. */
export default function PatronRequestTagSummary({
	patronRequestId,
}: {
	patronRequestId: string;
}) {
	const { t } = useTranslation();
	const gqlClient = useGraphQLClient();

	const tags = useQuery({
		...patronRequestTagsQuery(gqlClient, patronRequestId),
		...nonCriticalQuery,
	});
	const applied = appliedTags(tags.data?.patronRequests?.content?.[0]?.tags);

	const manage = () => {
		const section = document.getElementById(REQUEST_TAGS_SECTION_ID);
		section?.scrollIntoView({ block: "start" });
		section?.focus({ preventScroll: true });
	};

	return (
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
				// One small chip's height, so the page below does not move when they arrive
				<Skeleton variant="rounded" width={160} height={24} />
			) : tags.isError ? (
				<Typography variant="body2">
					{t("patron_request.tags.load_failed")}
				</Typography>
			) : applied.length === 0 ? (
				<Typography variant="body2">{t("patron_request.tags.none")}</Typography>
			) : (
				<TagList tags={applied} label={t("patron_request.tags.title")} />
			)}
			<Button size="small" onClick={manage}>
				{applied.length === 0
					? t("patron_request.tags.add_first")
					: t("patron_request.tags.manage")}
			</Button>
		</Stack>
	);
}
