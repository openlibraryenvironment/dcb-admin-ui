import type { TFunction } from "i18next";
import {
	getGridSingleSelectOperators,
	type GridColDef,
} from "@mui/x-data-grid-premium";

import TagList from "@components/TagChip/TagChip";
import { appliedTags } from "@helpers/requestTags";
import { luceneContainsPhrase } from "@filters/luceneContainsPhrase";
import type { PatronRequest } from "@models/PatronRequest";

/**
 * Added by useDynamicPatronRequestColumns while VITE_FEATURE_REQUEST_TAG_AND_NOTE_SEARCH is
 * on. Their fields are dcb-service's search fields, so buildFilterQuery needs nothing new:
 * `tagCode:CODE` and `noteText:"phrase"`. docs/request-tags.md
 */
export const tagsColumn = (
	t: TFunction,
	tagOptions: { value: string; label: string }[],
): GridColDef => ({
	field: "tagCode",
	headerName: t("patron_request.tags.title"),
	flex: 0.6,
	minWidth: 160,
	type: "singleSelect",
	valueOptions: tagOptions,
	filterOperators: getGridSingleSelectOperators().filter(({ value }) =>
		["is", "not", "isAnyOf"].includes(value),
	),
	// A request has several tags, and dcb-service has no order to sort them by
	sortable: false,
	// The labels, so an export writes what the cell shows
	valueGetter: (_value: unknown, row: PatronRequest) =>
		appliedTags(row?.tags)
			.map((tag) => tag.label)
			.join(", "),
	renderCell: ({ row }) => (
		<TagList
			tags={appliedTags(row?.tags)}
			label={t("patron_request.tags.title")}
			nowrap
		/>
	),
});

/** Filter-only: notes are not on the row, so the cell has nothing to show. */
export const noteTextColumn = (t: TFunction): GridColDef => ({
	field: "noteText",
	headerName: t("patron_request.notes.search"),
	flex: 0.4,
	sortable: false,
	disableExport: true,
	filterOperators: luceneContainsPhrase,
	valueGetter: () => "",
});
