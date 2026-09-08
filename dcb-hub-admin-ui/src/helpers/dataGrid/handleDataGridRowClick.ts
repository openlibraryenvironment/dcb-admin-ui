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
	if (rowModesModel[params.row.id]?.mode === GridRowModes.Edit) {
		event.defaultMuiPrevented = true;
		return;
	}

	if (
		nonClickableTypes.includes(type) &&
		!specialRedirectionTypes.includes(type)
	) {
		return;
	}

	let targetPath = `/${type}/${params.row.id}`;
	const rowId = params?.row?.id;

	if (specialRedirectionTypes.includes(type)) {
		if (type === "dataChangeLog") {
			targetPath = `/serviceInfo/dataChangeLog/${rowId}`;
		} else if (type == "welcomeLibraries") {
			targetPath = `/libraries/${rowId}`;
		} else if (type === "audits") {
			targetPath = `/patronRequests/audits/${params.row.id}`;
		} else if (type === "clusterMembers") {
			// A cluster member's id IS its source bib id (see getClusters `members`).
			targetPath = `/bibs/${rowId}`;
		} else {
			targetPath = `/patronRequests/${rowId}`;
		}
	}

	// if (specialRedirectionTypes.includes(type)) {
	// 	targetPath =
	// 		type === "audits"
	// 			? `/patronRequests/audits/${params.row.id}`
	// 			: `/patronRequests/${params.row.id}`;
	// }

	const openInNewTab = event.ctrlKey || event.metaKey;

	if (openInNewTab) {
		window.open(targetPath, "_blank");
	} else {
		navigate({ to: targetPath });
	}
};
