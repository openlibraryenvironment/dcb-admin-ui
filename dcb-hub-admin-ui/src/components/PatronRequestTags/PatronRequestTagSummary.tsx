import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Button, Stack, Typography } from "@mui/material";

import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { nonCriticalQuery } from "@helpers/queryPolicy";
import { patronRequestTagsQuery } from "@/queryOptions/patronRequestNotesAndTags";
import TagList from "@components/TagChip/TagChip";
import { appliedTags } from "@helpers/requestTags";

/**
 * A request's tags at the top of its General tab, with a way to the Tags tab. Nothing at all
 * when it has none, or they cannot be read: the Tags tab says which.
 */
export default function PatronRequestTagSummary({
	patronRequestId,
	onManage,
}: {
	patronRequestId: string;
	onManage: () => void;
}) {
	const { t } = useTranslation();
	const gqlClient = useGraphQLClient();

	const tags = useQuery({
		...patronRequestTagsQuery(gqlClient, patronRequestId),
		...nonCriticalQuery,
	});
	const applied = appliedTags(tags.data?.patronRequests?.content?.[0]?.tags);

	if (applied.length === 0) return null;

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
			<TagList tags={applied} label={t("patron_request.tags.title")} />
			<Button size="small" onClick={onManage}>
				{t("patron_request.tags.manage")}
			</Button>
		</Stack>
	);
}
