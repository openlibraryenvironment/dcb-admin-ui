import { useState } from "react";
import { GridColumnVisibilityModel } from "@mui/x-data-grid-premium";
import { useGridState } from "@hooks/useGridState";

/**
 * Mapping-grid state: the generic grid state from {@link useGridState} plus the
 * mapping-specific import / new-mapping UI flags. Keeps the same public API
 * (`handleX` change handlers) so existing consumers are unaffected.
 *
 * The edit/delete confirmation state that used to live here now belongs to
 * {@link useEntityMutation}, which owns that flow for every grid and page.
 */
export function useMappingGridState(
	gridId: string,
	defaultVisibility: GridColumnVisibilityModel = { lastImported: false },
) {
	const grid = useGridState(gridId, {
		pagination: { page: 0, pageSize: 20 },
		sort: [{ field: "lastImported", sort: "desc" }],
		columnVisibility: defaultVisibility,
	});

	const [showImport, setImport] = useState(false);
	const [showNewMapping, setNewMapping] = useState(false);

	return {
		paginationModel: grid.paginationModel,
		handlePaginationChange: grid.onPaginationModelChange,
		filterModel: grid.filterModel,
		handleFilterChange: grid.onFilterModelChange,
		sortModel: grid.sortModel,
		handleSortChange: grid.onSortModelChange,
		columnVisibilityModel: grid.columnVisibilityModel,
		handleColumnVisibilityChange: grid.onColumnVisibilityModelChange,
		rowModesModel: grid.rowModesModel,
		setRowModesModel: grid.setRowModesModel,
		showImport,
		setImport,
		showNewMapping,
		setNewMapping,
	};
}
