import {
	GridActionsCellItem,
	GridColDef,
	GridRowId,
	GridRowModel,
	GridRowModes,
	GridRowModesModel,
	GridRowParams,
} from "@mui/x-data-grid-premium";
import { Cancel, Delete, Edit, Save } from "@mui/icons-material";
import type { TFunction } from "i18next";
import type { MouseEvent, ReactElement } from "react";

interface RowEditActionsConfig {
	/** i18next translation function from the calling component. */
	t: TFunction;
	/** Current row edit modes (owned by the calling grid). */
	rowModesModel: GridRowModesModel;
	/** Setter for the row edit modes (owned by the calling grid). */
	setRowModesModel: (model: GridRowModesModel) => void;
	/**
	 * Invoked when the user confirms a delete for a given row id. Omit entirely
	 * on grids whose rows cannot be deleted (consortium functional settings) -
	 * the delete button is then not rendered at all, rather than rendered
	 * disabled, because there is no permission under which it would work.
	 */
	onDelete?: (id: GridRowId, row: GridRowModel) => void;
	/** When false, edit and delete are disabled (non-admin viewers). */
	canEdit?: boolean;
	/** Render the actions in an overflow menu instead of inline. */
	showInMenu?: boolean;
	/**
	 * Grid-specific actions shown alongside Edit/Delete in view mode (for
	 * example "add to group" on the libraries grid). Not shown while editing,
	 * where the only valid moves are save and cancel.
	 */
	extraActions?: (params: GridRowParams) => ReactElement[];
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
	showInMenu,
	extraActions,
	column,
}: RowEditActionsConfig): GridColDef {
	return {
		field: "actions",
		type: "actions",
		headerName: t("ui.data_grid.actions"),
		width: 100,
		getActions: (params: GridRowParams) => {
			const { id, row, columns } = params;
			const isEditing = rowModesModel[id]?.mode === GridRowModes.Edit;
			// Entering edit mode without `fieldToFocus` leaves focus on the Edit
			// button that just disappeared, so the row silently swaps to inputs with
			// nothing focused and no visible indication of where you are - a WCAG
			// 2.4.7 (focus visible) and 3.2.2 (on input) failure. Focus the row's
			// first editable cell, derived from the grid's own columns so a grid
			// cannot forget to name one.
			const fieldToFocus = columns.find((col) => col.editable)?.field;

			// `showInMenu` is the discriminant of GridActionsCellItemProps, so it
			// cannot be forwarded as `boolean | undefined` - the two branches take
			// different props. Pick the branch once here instead of at every action.
			// Row-click navigation is bound on the row, so the stopPropagation stops
			// an action click from routing away from the grid the moment you press
			// Edit or Delete. Harmless on grids whose rows are not clickable.
			const action = (
				key: string,
				icon: ReactElement,
				label: string,
				onClick: () => void,
				disabled?: boolean,
			) => {
				const handleClick = (event: MouseEvent<HTMLElement>) => {
					event.stopPropagation();
					onClick();
				};
				return showInMenu ? (
					<GridActionsCellItem
						key={key}
						showInMenu
						icon={icon}
						label={label}
						onClick={handleClick}
						disabled={disabled}
					/>
				) : (
					<GridActionsCellItem
						key={key}
						icon={icon}
						label={label}
						onClick={handleClick}
						disabled={disabled}
					/>
				);
			};

			if (isEditing) {
				return [
					action("save", <Save />, t("ui.data_grid.save"), () =>
						setRowModesModel({
							...rowModesModel,
							[id]: { mode: GridRowModes.View },
						}),
					),
					action("cancel", <Cancel />, t("ui.data_grid.cancel"), () =>
						setRowModesModel({
							...rowModesModel,
							[id]: { mode: GridRowModes.View, ignoreModifications: true },
						}),
					),
				];
			}

			return [
				...(extraActions?.(params) ?? []),
				action(
					"edit",
					<Edit />,
					t("ui.data_grid.edit"),
					() =>
						setRowModesModel({
							...rowModesModel,
							[id]: { mode: GridRowModes.Edit, fieldToFocus },
						}),
					!canEdit,
				),
				...(onDelete
					? [
							action(
								"delete",
								<Delete />,
								t("ui.data_grid.delete"),
								() => onDelete(id, row),
								!canEdit,
							),
						]
					: []),
			];
		},
		...column,
	};
}
