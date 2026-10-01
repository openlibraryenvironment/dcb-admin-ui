import {
	GridRowParams,
	GridRowModesModel,
	GridRowModes,
	MuiEvent,
} from "@mui/x-data-grid-premium";
import type { DataGridType } from "@constants/dataGrid/types";
import { resolveRowClickPath } from "@helpers/dataGrid/resolveRowClickPath";
import { appUrl } from "@helpers/appBase";

interface RowClickConfig {
	params: GridRowParams;
	event: MuiEvent<React.MouseEvent<HTMLElement>>;
	rowModesModel: GridRowModesModel;
	type: DataGridType;
	navigate: (options: { to: string }) => void;
}

/**
 * Handles routing and navigation when a user clicks a row in the DataGrid.
 * Respects edit modes, non-clickable grid types, and special URL redirection paths.
 */
export const handleDataGridRowClick = ({
	params,
	event,
	rowModesModel,
	type,
	navigate,
}: RowClickConfig) => {
	if (rowModesModel[params.row.id]?.mode === GridRowModes.Edit) {
		event.defaultMuiPrevented = true;
		return;
	}

	const targetPath = resolveRowClickPath(type, params.row.id);
	if (!targetPath) return;

	const openInNewTab = event.ctrlKey || event.metaKey;

	if (openInNewTab) {
		window.open(appUrl(targetPath), "_blank");
	} else {
		navigate({ to: targetPath });
	}
};
