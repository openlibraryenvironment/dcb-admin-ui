import { useState } from "react";
import { GridColumnVisibilityModel, GridRowId } from "@mui/x-data-grid-premium";
import { useGridState } from "@hooks/useGridState";

/**
 * Mapping-grid state: the generic grid state from {@link useGridState} plus the
 * mapping-specific edit / delete / import UI flags. Keeps the same public API
 * (`handleX` change handlers) so existing consumers are unaffected.
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

	const [promiseArguments, setPromiseArguments] = useState<any>(null);
	const [editRecord, setEditRecord] = useState<string | null>(null);
	const [deleteConfirmationId, setDeleteConfirmationId] =
		useState<GridRowId | null>(null);
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
		promiseArguments,
		setPromiseArguments,
		editRecord,
		setEditRecord,
		deleteConfirmationId,
		setDeleteConfirmationId,
		showImport,
		setImport,
		showNewMapping,
		setNewMapping,
	};
}
