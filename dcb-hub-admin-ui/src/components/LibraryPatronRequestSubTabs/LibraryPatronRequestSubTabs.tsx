import { Tab, Tabs } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useRouter } from "@tanstack/react-router";
import { useQueries } from "@tanstack/react-query";

import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { handleTabChange } from "@helpers/navigation/handleTabChange";
import { getPatronRequestTotals } from "@queries/getPatronRequestTotals";
import {
	getLibraryPatronRequestQueries,
	LibraryPatronRequestBucket,
} from "@constants/libraryPatronRequestQueries";

// The five workflow buckets for a single library's patron requests. `bucket`
// doubles as the route segment; `labelKey` resolves to "<Label> requests
// ({{number}})", so the count MUST be supplied - previously these passed
// `number: ""`, leaving the bug the user reported: empty brackets on every tab.
const SUBTABS: ReadonlyArray<{
	bucket: LibraryPatronRequestBucket;
	labelKey: string;
}> = [
	{ bucket: "all", labelKey: "libraries.patronRequests.all" },
	{
		bucket: "outOfSequence",
		labelKey: "libraries.patronRequests.out_of_sequence",
	},
	{ bucket: "active", labelKey: "libraries.patronRequests.active" },
	{ bucket: "completed", labelKey: "libraries.patronRequests.completed" },
	{ bucket: "exception", labelKey: "libraries.patronRequests.exception" },
];

interface LibraryPatronRequestSubTabsProps {
	libraryId: string;
	/** Patron-facing Host LMS code; counts only fetch once it is known. */
	code?: string;
	/** Which bucket's page is currently showing. */
	activeBucket: LibraryPatronRequestBucket;
}

export default function LibraryPatronRequestSubTabs({
	libraryId,
	code,
	activeBucket,
}: LibraryPatronRequestSubTabsProps) {
	const { t } = useTranslation();
	const router = useRouter();
	const gqlClient = useGraphQLClient();

	const bucketQueries = code ? getLibraryPatronRequestQueries(code) : null;

	// One totals request per bucket, keyed on code+bucket so all five library
	// patronRequests pages share the same cache entries and navigating between
	// them is instant.
	const results = useQueries({
		queries: SUBTABS.map((tab) => ({
			queryKey: ["patronRequestTotals", "library", code, tab.bucket],
			queryFn: () =>
				gqlClient.request<any>(getPatronRequestTotals, {
					query: bucketQueries?.[tab.bucket] ?? "",
					pageno: 0,
					pagesize: 1,
					order: "dateCreated",
					orderBy: "DESC",
				}),
			enabled: !!code,
			staleTime: 1000 * 60,
		})),
	});

	const pathFor = (bucket: LibraryPatronRequestBucket) =>
		`/libraries/${libraryId}/patronRequests/${bucket}`;

	return (
		<Tabs
			value={pathFor(activeBucket)}
			onChange={(_event, value) => handleTabChange({ newValue: value, router })}
			sx={{ mb: 2 }}
			aria-label={t("nav.libraries.patronRequests.name")}
		>
			{SUBTABS.map((tab, index) => (
				<Tab
					key={tab.bucket}
					value={pathFor(tab.bucket)}
					label={t(tab.labelKey, {
						number: results[index]?.data?.patronRequests?.totalSize ?? 0,
					})}
				/>
			))}
		</Tabs>
	);
}
