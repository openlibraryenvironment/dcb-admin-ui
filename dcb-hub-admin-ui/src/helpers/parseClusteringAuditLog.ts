import dayjs from "dayjs";

interface ClusterAuditLogEntry {
	id: string;
	processType: string;
	processId: string;
	subjectId: string;
	message: string;
	timestamp: string;
}

interface ClusterAuditLogResponse {
	ingest: Record<string, ClusterAuditLogEntry[]>;
}

export const CLUSTERING_EVENT_KINDS = [
	"highConfidenceMatch",
	"lowConfidenceCandidate",
	"exactTitleMatch",
	"titleSimilarityMatch",
	"titleSimilarityNoMatch",
	"matchedCluster",
	"mergedClusters",
	"outdatedCluster",
	"newCluster",
	"other",
] as const;

export type ClusteringEventKind = (typeof CLUSTERING_EVENT_KINDS)[number];

export const clusteringEventLabelKey = (kind: ClusteringEventKind) =>
	`search.clustering_event.${kind}`;

export interface ClusteringEventRow {
	id: string;
	/** The incoming bib the event explains. */
	subjectId: string;
	timestamp: string;
	formattedTimestamp: string;
	eventType: ClusteringEventKind;
	message: string;
	matchedBibId: string | null;
	matchedClusterId: string | null;
	matchCriteria: string | null;
	matchValue: string | null;
	processType: string;
	processId: string;
}

type Parsed = Partial<
	Pick<
		ClusteringEventRow,
		"matchedBibId" | "matchedClusterId" | "matchCriteria" | "matchValue"
	>
>;

const ID = "\\[([^\\]]+)\\]";
// dcb-service spells it "threashold"; either spelling is read, so a correction there does not
// turn every title comparison back into "other"
const THRESHOLD = "(?:threashold|threshold)";

/**
 * The messages dcb-service writes while clustering a bib: ImprovedRecordClusteringService at
 * 8.71.0, DefaultRecordClusteringService at 9.3.0, same strings.
 */
const FORMATS: ReadonlyArray<{
	kind: ClusteringEventKind;
	pattern: RegExp;
	read: (match: RegExpExecArray) => Parsed;
}> = [
	{
		kind: "highConfidenceMatch",
		pattern: new RegExp(
			`^High confidence match with Bib ${ID} on ${ID} = \\[(.*)\\]`,
		),
		read: ([, bib, criteria, value]) => ({
			matchedBibId: bib,
			matchCriteria: criteria,
			matchValue: value.trim(),
		}),
	},
	{
		kind: "lowConfidenceCandidate",
		pattern: new RegExp(`^One or more low confidence matches with bib ${ID}`),
		read: ([, bib]) => ({ matchedBibId: bib }),
	},
	{
		kind: "exactTitleMatch",
		pattern: new RegExp(
			`^Exact match on at least one title-type property with bib ${ID}`,
		),
		read: ([, bib]) => ({ matchedBibId: bib }),
	},
	{
		kind: "titleSimilarityMatch",
		pattern: new RegExp(
			`^Blocking title similarity ${ID} with bib ${ID} greater or equal to ${THRESHOLD} ${ID}`,
		),
		read: ([, score, bib]) => ({ matchedBibId: bib, matchValue: score }),
	},
	{
		// The score is left out: dcb-service prints the raw fraction with a % sign here
		kind: "titleSimilarityNoMatch",
		pattern: new RegExp(
			`^Blocking title similarity ${ID} with bib ${ID} less than ${THRESHOLD}`,
		),
		read: ([, , bib]) => ({ matchedBibId: bib }),
	},
	{
		kind: "matchedCluster",
		pattern: new RegExp(`^Matched single cluster ${ID}`),
		read: ([, cluster]) => ({ matchedClusterId: cluster }),
	},
	{
		kind: "mergedClusters",
		pattern: new RegExp(`^Matched cluster ${ID} \\(merging with \\[(\\d+)\\]`),
		read: ([, cluster, others]) => ({
			matchedClusterId: cluster,
			matchValue: others,
		}),
	},
	{
		kind: "outdatedCluster",
		pattern: new RegExp(`^Cluster ${ID} contains outdated bibs`),
		read: ([, cluster]) => ({ matchedClusterId: cluster }),
	},
	{
		kind: "newCluster",
		pattern: /^No existing cluster/,
		read: () => ({}),
	},
];

export const classifyClusteringMessage = (
	message: string,
): { kind: ClusteringEventKind } & Parsed => {
	for (const { kind, pattern, read } of FORMATS) {
		const match = pattern.exec(message);
		if (match) return { kind, ...read(match) };
	}
	return { kind: "other" };
};

export const parseClusteringAuditLog = (
	data: ClusterAuditLogResponse | null | undefined,
): ClusteringEventRow[] => {
	if (!data?.ingest) return [];

	return Object.entries(data.ingest).flatMap(([subjectId, events]) =>
		events.map((event) => {
			const { kind, ...parsed } = classifyClusteringMessage(event.message);
			return {
				id: event.id,
				subjectId,
				timestamp: event.timestamp,
				formattedTimestamp: dayjs(event.timestamp).format("YYYY-MM-DD HH:mm"),
				eventType: kind,
				message: event.message,
				matchedBibId: parsed.matchedBibId ?? null,
				matchedClusterId: parsed.matchedClusterId ?? null,
				matchCriteria: parsed.matchCriteria ?? null,
				matchValue: parsed.matchValue ?? null,
				processType: event.processType,
				processId: event.processId,
			};
		}),
	);
};
