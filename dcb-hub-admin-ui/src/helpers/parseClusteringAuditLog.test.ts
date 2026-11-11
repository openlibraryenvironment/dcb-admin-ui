import { describe, expect, it } from "vitest";

import {
	classifyClusteringMessage,
	parseClusteringAuditLog,
} from "./parseClusteringAuditLog";

const BIB = "99aa0000-9999-5999-9999-aaaaaaaaaaaa";
const CLUSTER = "c1c10000-1111-5111-9111-cccccccccccc";

// Each message as dcb-service formats it (DefaultRecordClusteringService, 9.3.0)
describe("classifyClusteringMessage", () => {
	it.each([
		[
			`High confidence match with Bib [${BIB}] on [ISBN] = [9780000000001]`,
			{
				kind: "highConfidenceMatch",
				matchedBibId: BIB,
				matchCriteria: "ISBN",
				matchValue: "9780000000001",
			},
		],
		[
			`One or more low confidence matches with bib [${BIB}], check title-type properties...`,
			{ kind: "lowConfidenceCandidate", matchedBibId: BIB },
		],
		[
			`Exact match on at least one title-type property with bib [${BIB}]. Match!`,
			{ kind: "exactTitleMatch", matchedBibId: BIB },
		],
		[
			`Blocking title similarity [92.31%] with bib [${BIB}] greater or equal to threashold [90.00%]. Match!`,
			{ kind: "titleSimilarityMatch", matchedBibId: BIB, matchValue: "92.31%" },
		],
		[
			`Blocking title similarity [0.45%] with bib [${BIB}] less than threashold [0.90%]. No Match`,
			{ kind: "titleSimilarityNoMatch", matchedBibId: BIB },
		],
		[
			`Matched single cluster [${CLUSTER}]`,
			{ kind: "matchedCluster", matchedClusterId: CLUSTER },
		],
		[
			`Matched cluster [${CLUSTER}] (merging with [2] other clusters)`,
			{ kind: "mergedClusters", matchedClusterId: CLUSTER, matchValue: "2" },
		],
		[
			`Cluster [${CLUSTER}] contains outdated bibs, flag for reprocessing and ignore match at this time`,
			{ kind: "outdatedCluster", matchedClusterId: CLUSTER },
		],
		["No existing cluster, create a new one", { kind: "newCluster" }],
		["Something dcb-service has not written yet", { kind: "other" }],
	])("%s", (message, expected) => {
		expect(classifyClusteringMessage(message)).toEqual(expected);
	});

	it("reads the corrected spelling of threshold too", () => {
		expect(
			classifyClusteringMessage(
				`Blocking title similarity [92.31%] with bib [${BIB}] greater or equal to threshold [90.00%]. Match!`,
			).kind,
		).toBe("titleSimilarityMatch");
	});
});

describe("parseClusteringAuditLog", () => {
	it("gives each event the bib it explains and what its message names", () => {
		const rows = parseClusteringAuditLog({
			ingest: {
				subject: [
					{
						id: "e1",
						processType: "BIB_INGEST",
						processId: "p",
						subjectId: "subject",
						message: `Matched cluster [${CLUSTER}] (merging with [1] other clusters)`,
						timestamp: "2026-09-30T14:00:00Z",
					},
				],
			},
		});

		expect(rows).toEqual([
			expect.objectContaining({
				id: "e1",
				subjectId: "subject",
				eventType: "mergedClusters",
				matchedClusterId: CLUSTER,
				matchedBibId: null,
			}),
		]);
	});

	it("has nothing to show without a response", () => {
		expect(parseClusteringAuditLog(null)).toEqual([]);
	});
});
