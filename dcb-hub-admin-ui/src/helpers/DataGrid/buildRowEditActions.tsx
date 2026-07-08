import {
	GridActionsCellItem,
	GridColDef,
	GridRowId,
	GridRowModes,
	GridRowModesModel,
	GridRowParams,
} from "@mui/x-data-grid-premium";
import { Cancel, Delete, Edit, Save } from "@mui/icons-material";
import type { TFunction } from "i18next";

interface RowEditActionsConfig {
	/** i18next translation function from the calling component. */
	t: TFunction;
	/** Current row edit modes (owned by the calling grid). */
	rowModesModel: GridRowModesModel;
	/** Setter for the row edit modes (owned by the calling grid). */
	setRowModesModel: (model: GridRowModesModel) => void;
	/** Invoked when the user confirms a delete for a given row id. */
	onDelete: (id: GridRowId) => void;
	/** When false, edit and delete are disabled (non-admin viewers). */
	canEdit?: boolean;
	/** Overrides for the generated column definition (width, headerName, ...). */
	column?: Partial<GridColDef>;
}

/**
 * Builds the standard row-editing actions column (Edit / Delete in view mode,
 * Save / Cancel while editing) shared by every editable grid. Extracted from
 * the copy-pasted `getActions` blocks so the interaction, a11y labels, and
 * admin gating stay identical across grids.
 *
 * The grid still owns `rowModesModel`, the delete confirmation flow, and
 * `processRowUpdate`; this only renders the buttons and toggles edit mode.
 */
export function buildRowEditActionsColumn({
	t,
	rowModesModel,
	setRowModesModel,
	onDelete,
	canEdit = true,
	column,
}: RowEditActionsConfig): GridColDef {
	return {
		field: "actions",
		type: "actions",
		headerName: t("ui.data_grid.actions"),
		width: 100,
		getActions: ({ id }: GridRowParams) => {
			const isEditing = rowModesModel[id]?.mode === GridRowModes.Edit;

			if (isEditing) {
				return [
					<GridActionsCellItem
						key="save"
						icon={<Save />}
						label={t("ui.save")}
						onClick={() =>
							setRowModesModel({
								...rowModesModel,
								[id]: { mode: GridRowModes.View },
							})
						}
					/>,
					<GridActionsCellItem
						key="cancel"
						icon={<Cancel />}
						label={t("ui.cancel")}
						onClick={() =>
							setRowModesModel({
								...rowModesModel,
								[id]: { mode: GridRowModes.View, ignoreModifications: true },
							})
						}
					/>,
				];
			}

			return [
				<GridActionsCellItem
					key="edit"
					icon={<Edit />}
					label={t("ui.data_grid.edit")}
					onClick={() =>
						setRowModesModel({
							...rowModesModel,
							[id]: { mode: GridRowModes.Edit },
						})
					}
					disabled={!canEdit}
				/>,
				<GridActionsCellItem
					key="delete"
					icon={<Delete />}
					label={t("ui.data_grid.delete")}
					onClick={() => onDelete(id)}
					disabled={!canEdit}
				/>,
			];
		},
		...column,
	};
}
