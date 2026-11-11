import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Chip } from "@mui/material";
import {
	AddCircleOutlined,
	CallMerge,
	CheckCircle,
	HelpOutlined,
	Info,
	Link as LinkIcon,
	RemoveCircleOutlined,
	Warning,
} from "@mui/icons-material";

import {
	type ClusteringEventKind,
	clusteringEventLabelKey,
} from "@helpers/parseClusteringAuditLog";

/**
 * Colour sits on the icon only: the label keeps body text colour, which outlined warning and
 * info chips did not (about 3.1:1 and 3.9:1 on white). The label carries the meaning on its own.
 */
const TONE: Record<ClusteringEventKind, ReactElement> = {
	highConfidenceMatch: <CheckCircle color="success" />,
	exactTitleMatch: <CheckCircle color="success" />,
	titleSimilarityMatch: <CheckCircle color="success" />,
	lowConfidenceCandidate: <HelpOutlined color="info" />,
	titleSimilarityNoMatch: <RemoveCircleOutlined color="action" />,
	matchedCluster: <LinkIcon color="primary" />,
	mergedClusters: <CallMerge color="warning" />,
	outdatedCluster: <Warning color="warning" />,
	newCluster: <AddCircleOutlined color="primary" />,
	other: <Info color="action" />,
};

export default function ClusteringEventChip({
	kind,
}: {
	kind: ClusteringEventKind;
}) {
	const { t } = useTranslation();
	return (
		<Chip
			label={t(clusteringEventLabelKey(kind))}
			icon={TONE[kind] ?? TONE.other}
			size="small"
			variant="outlined"
		/>
	);
}
