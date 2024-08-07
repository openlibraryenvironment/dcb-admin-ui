import {
	DataGridPro,
	GridColDef,
	GridEventListener,
	GridFilterModel,
	GridSortModel,
} from "@mui/x-data-grid-pro";
import { DocumentNode, useQuery } from "@apollo/client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { MdExpandLess, MdExpandMore } from "react-icons/md";
import {
	CustomNoDataOverlay,
	CustomNoResultsOverlay,
} from "./components/DynamicOverlays";
import QuickSearchToolbar from "./components/QuickSearchToolbar";

// Slots that won't change are defined here to stop them from being re-created on every render.
// See https://mui.com/x/react-data-grid/performance/#extract-static-objects-and-memoize-root-props
const staticSlots = {
	toolbar: QuickSearchToolbar,
	detailPanelExpandIcon: MdExpandMore,
	detailPanelCollapseIcon: MdExpandLess,
};

export default function ServerPaginationGrid({
	query,
	type,
	selectable,
	pageSize,
	columns,
	columnVisibilityModel,
	sortModel,
	noResultsMessage,
	noDataMessage,
	searchPlaceholder,
	sortDirection,
	sortAttribute,
	coreType,
	scrollbarVisible,
	disableHoverInteractions,
	presetQueryVariables,
	onTotalSizeChange,
	getDetailPanelContent,
}: {
	query: DocumentNode;
	type: string;
	selectable: boolean;
	pageSize: number;
	columns: GridColDef[];
	columnVisibilityModel?: any;
	sortModel?: any;
	noResultsMessage?: string;
	noDataMessage?: string;
	noDataTitle?: string;
	searchPlaceholder?: string;
	sortDirection: string;
	sortAttribute: string;
	coreType: string;
	scrollbarVisible?: boolean;
	disableHoverInteractions?: boolean;
	presetQueryVariables?: string;
	onTotalSizeChange?: any;
	getDetailPanelContent?: any;
}) {
	// The core type differs from the regular type prop, because it is the 'core data type' - i.e. if type is CircStatus, details type is RefValueMappings
	// GraphQL data comes in an array that's named after the core type, which causes problems
	const [sortOptions, setSortOptions] = useState({ field: "", direction: "" });
	const [filterOptions, setFilterOptions] = useState("");
	const { t } = useTranslation();
	const router = useRouter();
	const presetTypes = [
		"circulationStatus",
		"patronRequestsLibraryException",
		"patronRequestsLibraryActive",
		"patronRequestsLibraryOutOfSequence",
		"patronRequestsLibraryCompleted",
		"referenceValueMappingsForLibrary",
		"numericRangeMappingsForLibrary",
		"referenceValueMappings",
		"numericRangeMappings",
	];

	// TODO in future work:
	// Support filtering by date on Patron Requests

	const getDetailPanelHeight = useCallback(() => "auto", []); // Should be able to take this out when master detail is expanded to all

	const [paginationModel, setPaginationModel] = useState({
		page: 0,
		pageSize: pageSize,
	});

	const handleSortModelChange = useCallback(
		(sortModel: GridSortModel) => {
			// sortDirection and sortAttributes are our defaults, passed in from each instance.
			// They are intended for use on first load, or if the sortModel value is ever null or undefined.
			setSortOptions({
				field: sortModel[0]?.field ?? sortAttribute,
				direction: sortModel[0]?.sort?.toUpperCase() ?? sortDirection,
			});
		},
		[sortDirection, sortAttribute],
	);

	const onFilterChange = useCallback(
		(filterModel: GridFilterModel) => {
			const filters = filterModel?.items ?? [];
			const quickFilterValues = filterModel?.quickFilterValues ?? [];
			const logicOperator = filterModel?.logicOperator?.toUpperCase() ?? "AND";

			// Helper function to process the individual filters
			const buildFilterQuery = (
				field: string,
				operator: string,
				value: string,
			) => {
				const replacedValue = value.replaceAll(" ", "?");
				// Question marks are used to replace spaces in search terms- see Lucene docs https://lucene.apache.org/core/9_9_1/queryparser/org/apache/lucene/queryparser/classic/package-summary.html#package.description
				// Lucene powers our server-side querying so we need to get expressions into the right syntax.
				// We're currently only supporting contains and equals, but other operators are possible - see docs.
				// We will also need to introduce type handling - i.e. for UUIDs, numbers etc - based on the field.
				switch (operator) {
					case "contains":
						return `${field}:*${replacedValue}*`;
					case "equals":
						return `${field}:${replacedValue}`;
					default:
						return `${field}:${replacedValue}`;
				}
			};

			// Build the filter query for all filters
			let filterQuery = filters
				.map((filter) =>
					buildFilterQuery(
						filter.field ?? "id",
						filter.operator ?? "contains",
						filter.value ?? "",
					),
				)
				.join(" " + logicOperator + " ");

			// Add quick filters if present
			if (quickFilterValues.length > 0) {
				const quickQueries = quickFilterValues.map((qv) =>
					qv.replaceAll(" ", "?"),
				);
				const quickFieldMap: Record<string, string> = {
					bibs: "sourceRecordId",
					patronRequests: "errorMessage",
					patronRequestsLibraryException: "errorMessage",
					patronRequestsLibraryOutOfSequence: "status",
					patronRequestsLibraryActive: "status",
					patronRequestsLibraryCompleted: "status",
					circulationStatus: "fromContext",
					referenceValueMappings: "fromCategory",
					referenceValueMappingsForLibrary: "fromCategory",
					numericRangeMappings: "domain",
					numericRangeMappingsForLibrary: "domain",
					libraries: "fullName",
					agencies: "name",
					groups: "name",
					hostlmss: "name",
					locations: "name",
					dataChangeLog: "actionInfo",
					default: "id",
				};

				const quickField = quickFieldMap[type] ?? quickFieldMap.default;
				const quickFilterQuery = quickQueries
					.map((qv) => `${quickField}:*${qv}*`)
					.join(" && ");
				filterQuery = filterQuery
					? `${filterQuery} && ${quickFilterQuery}`
					: quickFilterQuery;
			}

			// Add specific logic for types that need it.
			// This is particularly useful for things like mappings, where we don't want to query deleted mappings unless explicitly stated.
			switch (type) {
				case "circulationStatus":
				case "patronRequestLibrary":
				case "patronRequestsLibraryException":
				case "patronRequestsLibraryOutOfSequence":
				case "patronRequestsLibraryActive":
				case "patronRequestsLibraryCompleted":
				case "referenceValueMappingsForLibrary":
				case "numericRangeMappingsForLibrary":
					filterQuery =
						filterQuery != ""
							? `${presetQueryVariables} && ${filterQuery}`
							: `${presetQueryVariables}`; // If filter query is blank, revert to the presets.
					break;
			}

			// Set the final filter options
			setFilterOptions(filterQuery);
		},
		[presetQueryVariables, type],
	);

	const sortField =
		sortOptions.direction !== "" ? sortOptions.field : sortAttribute;
	const direction =
		sortOptions.direction !== "" ? sortOptions.direction : sortDirection;
	const { loading, data } = useQuery(query, {
		variables: {
			// Fixes 'ghost page' issue.
			pageno: paginationModel.page,
			pagesize: paginationModel.pageSize,
			order: sortField,
			orderBy: direction,
			query:
				presetTypes.includes(type) && filterOptions == ""
					? presetQueryVariables
					: filterOptions,
		},
	});

	const totalSize = data?.[coreType]?.totalSize;

	useEffect(() => {
		if (totalSize !== undefined) {
			setRowCountState(totalSize);
			onTotalSizeChange?.(type, totalSize);
		}
	}, [totalSize, onTotalSizeChange, type]);

	// Some API clients return undefined while loading
	// Following lines are here to prevent `rowCountState` from being undefined during the loading

	// the core type prop matches to the array name coming from GraphQL
	// so CircStatus' coreType is referenceValueMappings
	// thus avoiding the issue accessing the array that would otherwise occur.
	const [rowCountState, setRowCountState] = useState(
		data?.[coreType].totalSize || 0,
	);
	useEffect(() => {
		setRowCountState((prevRowCountState: any) =>
			data?.[coreType]?.totalSize !== undefined
				? data?.[coreType]?.totalSize
				: prevRowCountState,
		);
	}, [data, setRowCountState, coreType]);

	// Listens for a row being clicked, passes through the params so they can be used to display the correct 'Details' page.
	// And formulate the correct URL
	// plurals are used for types to match URL structure.
	const handleRowClick: GridEventListener<"rowClick"> = (params, event) => {
		// Some grids, like the PRs on the library page, need special redirection
		if (
			type === "patronRequestsLibraryActive" ||
			type === "patronRequestsLibraryOutOfSequence" ||
			type === "patronRequestsLibraryCompleted" ||
			type === "patronRequestsLibraryException" ||
			type === "dataChangeLog"
		) {
			if (event.ctrlKey || event.metaKey)
				if (type === "dataChangeLog") {
					window.open(
						`/serviceInfo/dataChangeLog/${params?.row?.id}`,
						"_blank",
					);
				} else {
					window.open(`/patronRequests/${params?.row?.id}`, "_blank");
				}
			if (!(event.ctrlKey || event.metaKey))
				if (type === "dataChangeLog") {
					router.push(`/serviceInfo/dataChangeLog/${params?.row?.id}`);
				} else {
					router.push(`/patronRequests/${params?.row?.id}`);
				}
		} else if (
			// Others we don't want users to be able to click through on
			type !== "referenceValueMappings" &&
			type !== "circulationStatus" &&
			type !== "numericRangeMappings" &&
			type !== "referenceValueMappingsForLibrary" &&
			type !== "numericRangeMappingsForLibrary"
		) {
			// Whereas most can just use this standard redirection based on type
			if (event.ctrlKey || event.metaKey)
				window.open(`/${type}/${params?.row?.id}`, "_blank");
			if (!(event.ctrlKey || event.metaKey))
				router.push(`/${type}/${params?.row?.id}`);
		}
	};

	return (
		<div>
			<DataGridPro
				// Makes sure scrollbars aren't visible
				sx={{
					border: "0",
					"@media print": {
						".MuiDataGrid-main": { color: "rgba(0, 0, 0, 0.87)" },
					},
					".MuiDataGrid-virtualScroller": {
						overflow: scrollbarVisible ? "" : "hidden",
					},
					// both hover styles need to be added, otherwise a flashing effect appears when hovering
					// https://stackoverflow.com/questions/76563478/disable-hover-effect-on-mui-datagrid
					"& .MuiDataGrid-row.Mui-hovered": {
						backgroundColor: disableHoverInteractions ? "transparent" : "",
					},
					"& .MuiDataGrid-row:hover": {
						backgroundColor: disableHoverInteractions ? "transparent" : "",
					},
					"& .MuiDataGrid-cell:focus": {
						outline: disableHoverInteractions ? "none" : "",
					},
					"& .MuiDataGrid-detailPanel": {
						overflow: "hidden", // Prevent scrollbars in the detail panel
						height: "auto", // Adjust height automatically
					},
				}}
				columns={columns}
				rows={data?.[coreType]?.content ?? []}
				{...data}
				rowCount={rowCountState}
				loading={loading}
				checkboxSelection={selectable}
				disableRowSelectionOnClick
				filterMode="server"
				onRowClick={handleRowClick}
				onFilterModelChange={onFilterChange}
				pageSizeOptions={[5, 10, 20, 30, 40, 50, 100, 200]}
				pagination
				paginationModel={paginationModel}
				paginationMode="server"
				sortingMode="server"
				// sortingOrder={['asc', 'desc']} // If enabled, this will remove the 'null' sorting option
				onSortModelChange={handleSortModelChange}
				onPaginationModelChange={setPaginationModel}
				autoHeight={true}
				slots={{
					...staticSlots,
					noResultsOverlay: () => (
						<CustomNoResultsOverlay noResultsMessage={noResultsMessage} />
					),
					noRowsOverlay: () => (
						<CustomNoDataOverlay noDataMessage={noDataMessage} />
					),
				}}
				localeText={{
					toolbarQuickFilterPlaceholder:
						searchPlaceholder ?? t("general.search"),
					columnsManagementSearchTitle: t("ui.data_grid.find_column"),
					toolbarExportCSV: t("ui.data_grid.download_current_page"),
					toolbarExportPrint: t("ui.data_grid.print_current_page"),
				}}
				getDetailPanelContent={getDetailPanelContent}
				getDetailPanelHeight={getDetailPanelHeight}
				// See examples here for what can be customised
				// https://github.com/mui/mui-x/blob/next/packages/grid/x-data-grid/src/constants/localeTextConstants.ts
				// https://stackoverflow.com/questions/75697255/how-to-change-mui-datagrid-toolbar-label-and-input-placeholder-text
				initialState={{
					columns: {
						columnVisibilityModel,
					},
					sorting: {
						sortModel,
					},
				}}
				slotProps={{
					toolbar: {
						showQuickFilter: true,
					},
				}}
			/>
		</div>
	);
}
