import { GridRowId } from "@mui/x-data-grid-premium";
import { determineDataGridPathOnClick } from "./determineDataGridPathOnClick";

export const createActionItems = (
	params: any,
	type: string,
	isAnAdmin: boolean,
	isInEditMode: boolean,
	nonClickableTypes: string[],
	actionsTypes: string[],
	isAnyRowEditing: () => boolean,
	handleEditClick: (id: GridRowId) => () => void,
	handleSaveClick: (id: GridRowId) => () => void,
	handleCancelClick: (id: GridRowId) => () => void,
	setConfirmationModalOpen: (open: boolean) => void,
	setEntityToDelete: (id: string | null) => void,
	router: any,
	t: (key: string) => string,
) => {
	if (isInEditMode) {
		return [
			{
				icon: "Save",
				label: t("ui.data_grid.save"),
				onClick: handleSaveClick(params?.row?.id),
			},
			{
				icon: "Cancel",
				label: t("ui.data_grid.cancel"),
				onClick: handleCancelClick(params?.row?.id),
			},
		];
	} else if (!isAnAdmin && !nonClickableTypes.includes(type)) {
		return [
			{
				icon: "Visibility",
				label: t("ui.data_grid.open"),
				onClick: () =>
					router.push(determineDataGridPathOnClick(type, params?.row?.id)),
			},
		];
	} else if (isAnAdmin && nonClickableTypes.includes(type)) {
		return [
			{
				icon: "Edit",
				label: t("ui.data_grid.edit"),
				onClick: handleEditClick(params?.row?.id),
				disabled: isAnyRowEditing(),
			},
			{
				icon: "Delete",
				label: t("ui.data_grid.delete"),
				onClick: () => {
					setConfirmationModalOpen(true);
					setEntityToDelete(params?.row?.id);
				},
				disabled: isAnyRowEditing(),
			},
		];
	}
	// Default case: admin, clickable grid, editing enabled
	return [
		{
			icon: "Edit",
			label: t("ui.data_grid.edit"),
			onClick: handleEditClick(params?.row?.id),
			disabled: isAnyRowEditing(),
		},
		{
			icon: "Delete",
			label: t("ui.data_grid.delete"),
			onClick: () => {
				setConfirmationModalOpen(true);
				setEntityToDelete(params?.row?.id);
			},
			disabled: isAnyRowEditing(),
		},
		{
			icon: "Visibility",
			label: t("ui.data_grid.open"),
			onClick: () =>
				router.push(determineDataGridPathOnClick(type, params?.row?.id)),
			disabled: isAnyRowEditing() || nonClickableTypes.includes(type),
		},
	];
};
