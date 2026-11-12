import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "react-oidc-context";
import { Alert, AccordionSummary, Typography } from "@mui/material";
import { ExpandMore } from "@mui/icons-material";

import {
	StyledAccordion,
	StyledAccordionDetails,
} from "@components/StyledAccordion/StyledAccordion";
import { useDcbRestClient } from "@hooks/useDcbRestClient";
import { nonCriticalQuery } from "@helpers/queryPolicy";
import { serverAdmits } from "@constants/serverRoles";
import { RULESET_STALE_TIME, rulesetKeys } from "@/queryOptions/rulesets";

/** A suppression ruleset's definition, fetched the first time its accordion opens. */
export default function RulesetDetailsAccordion({
	title,
	rulesetName,
}: {
	title: string;
	rulesetName: string;
}) {
	const { t } = useTranslation();
	const client = useDcbRestClient();
	const auth = useAuth();
	const [expanded, setExpanded] = useState(false);
	const canRead = serverAdmits(
		"readRulesets",
		auth?.user?.profile?.roles as string[] | undefined,
	);

	const ruleset = useQuery({
		...nonCriticalQuery,
		queryKey: rulesetKeys.detail(rulesetName),
		queryFn: async () =>
			(await client.get(`/object-rules/${encodeURIComponent(rulesetName)}`))
				.data,
		staleTime: RULESET_STALE_TIME,
		enabled: expanded && canRead,
	});

	const status = () => {
		if (!canRead)
			return <Alert severity="info">{t("libraries.ruleset_admin_only")}</Alert>;
		if (ruleset.isError)
			return (
				<Alert severity="error">
					{t("libraries.ruleset_load_failed", { name: rulesetName })}
				</Alert>
			);
		if (!ruleset.data)
			return <Typography>{t("libraries.ruleset_loading")}</Typography>;
		return null;
	};

	return (
		<StyledAccordion
			expanded={expanded}
			onChange={(_, isExpanded) => setExpanded(isExpanded)}
		>
			<AccordionSummary expandIcon={<ExpandMore />}>
				<Typography variant="h3" component="span" sx={{ fontWeight: "bold" }}>
					{title}
				</Typography>
			</AccordionSummary>
			<StyledAccordionDetails>
				<div role="status" aria-live="polite">
					{status()}
				</div>
				{canRead && ruleset.data && (
					<pre>{JSON.stringify(ruleset.data, null, 2)}</pre>
				)}
			</StyledAccordionDetails>
		</StyledAccordion>
	);
}
