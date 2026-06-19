import {
	GridRowParams,
	GridRowModesModel,
	GridRowModes,
	MuiEvent,
} from "@mui/x-data-grid-premium";
import {
	nonClickableTypes,
	specialRedirectionTypes,
} from "@constants/dataGrid/types";

interface RowClickConfig {
	params: GridRowParams;
	event: MuiEvent<React.MouseEvent<HTMLElement>>;
	rowModesModel: GridRowModesModel;
	type: string;
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
	// 1. Guard Clause: Block navigation if the row is currently in Edit Mode
	if (rowModesModel[params.row.id]?.mode === GridRowModes.Edit) {
		event.defaultMuiPrevented = true;
		return;
	}

	// 2. Guard Clause: Abort if this grid type is strictly non-clickable
	if (
		nonClickableTypes.includes(type) &&
		!specialRedirectionTypes.includes(type)
	) {
		return;
	}

	// 3. Resolve the target URL path dynamically
	let targetPath = `/${type}/${params.row.id}`; // Default fallback

	if (specialRedirectionTypes.includes(type)) {
		targetPath =
			type === "audits"
				? `/patronRequests/audits/${params.row.id}`
				: `/patronRequests/${params.row.id}`;
	}

	// 4. Execute the Navigation
	const openInNewTab = event.ctrlKey || event.metaKey;

	if (openInNewTab) {
		// Native browser behavior for opening a new tab
		window.open(targetPath, "_blank");
	} else {
		// High-performance client-side SPA routing via TanStack
		navigate({ to: targetPath });
	}
};
