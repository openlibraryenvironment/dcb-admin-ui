import {
	DataGridPro,
	GridEventListener,
	GridFilterModel,
	GridSortModel,
	GridToolbar,
	GridToolbarQuickFilter,
} from "@mui/x-data-grid-pro";
import { DocumentNode, useQuery } from "@apollo/client";
import { useCallback, useEffect, useState } from "react";
import { styled } from "@mui/material/styles"; // Import separately due to this issue https://github.com/vercel/next.js/issues/55663
import { Box, Typography } from "@mui/material";
import { useRouter } from "next/router";

const StyledOverlay = styled("div")(() => ({
	display: "flex",
	flexDirection: "column",
	alignItems: "center",
	justifyContent: "center",
	height: "100%",
}));

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
}: {
	query: DocumentNode;
	type: string;
	selectable: boolean;
	pageSize: number;
	columns: any;
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
}) {
	// The core type differs from the regular type prop, because it is the 'core data type' - i.e. if type is CircStatus, details type is RefValueMappings
	// GraphQL data comes in an array that's named after the core type, which causes problems
	const [sortOptions, setSortOptions] = useState({ field: "", direction: "" });
	const [filterOptions, setFilterOptions] = useState("");
	const router = useRouter();

	// TODO in future work:
	// Support filtering by date on Patron Requests
	// Multi-Filter GUI

	function CustomNoDataOverlay() {
		return (
			<StyledOverlay>
				<Box sx={{ mt: 1 }}>
					<Typography variant="body1"> {noDataMessage} </Typography>
				</Box>
			</StyledOverlay>
		);
	}

	function CustomNoResultsOverlay() {
		return (
			<StyledOverlay>
				<Box sx={{ mt: 1 }}>
					<Typography variant="body1"> {noResultsMessage} </Typography>
				</Box>
			</StyledOverlay>
		);
	}

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
					patronRequests: "description",
					circulationStatus: "fromContext",
					referenceValueMappings: "fromCategory",
					numericRangeMappings: "domain",
					libraries: "fullName",
					agencies: "name",
					groups: "name",
					hostlmss: "name",
					locations: "name",
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
					filterQuery = `fromCategory: CirculationStatus && deleted: false && ${filterQuery}`;
					break;
			}

			// Set the final filter options
			setFilterOptions(filterQuery);
		},
		[type],
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
				type === "circulationStatus" && filterOptions == ""
					? `fromCategory: CirculationStatus && deleted: false`
					: filterOptions,
		},
	});

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
	const handleRowClick: GridEventListener<"rowClick"> = (params) => {
		if (
			type !== "GroupDetails" &&
			type !== "referenceValueMappings" &&
			type !== "Audit" &&
			type !== "circulationStatus" &&
			type !== "numericRangeMappings"
		) {
			router.push(`/${type}/${params?.row?.id}`);
		}
	};

	return (
		<div>
			<DataGridPro
				// Makes sure scrollbars aren't visible
				sx={
					scrollbarVisible
						? {
								border: "0",
							}
						: {
								".MuiDataGrid-virtualScroller": {
									overflow: "hidden",
								},
								border: "0",
							}
				}
				//DCB-396 (https://mui.com/x/react-data-grid/accessibility/#accessibility-changes-in-v7)
				// v7 of the DataGrid removes this but also breaks accessibility - to be looked at when we upgrade.
				experimentalFeatures={{ ariaV7: true }}
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
					toolbar: QuickSearchToolbar,
					noResultsOverlay: CustomNoResultsOverlay,
					noRowsOverlay: CustomNoDataOverlay,
				}}
				localeText={{
					toolbarQuickFilterPlaceholder: searchPlaceholder ?? "Search",
				}}
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

function QuickSearchToolbar() {
	return (
		<Box
			sx={{
				p: 0.5,
				pb: 0,
			}}
		>
			<GridToolbar />
			<GridToolbarQuickFilter
				debounceMs={100}
				quickFilterParser={(searchInput: string) =>
					searchInput
						.split(",")
						.map((value) => value.trim())
						.filter((value) => value !== "")
				}
			/>
		</Box>
	);
}
