import { ApolloClient } from "@apollo/client";
import { TFunction } from "i18next";
import { isEmpty } from "lodash";
import { Dispatch, RefObject, SetStateAction } from "react";

export const handleSaveConfirmation = async (
	entity: any,
	changedFields: any,
	updateEntity: any,
	client: ApolloClient<object>,
	setEditMode: Dispatch<SetStateAction<boolean>>,
	setChangedFields: Dispatch<SetStateAction<any>>,
	setAlert: Dispatch<SetStateAction<any>>,
	setConfirmationEdit: Dispatch<SetStateAction<any>>,
	t: TFunction<"common" | "application" | "validation">,
	reason: string,
	changeCategory: string,
	changeReferenceUrl: string,
	updateName: string,
) => {
	try {
		const { data } = await updateEntity({
			variables: {
				input: {
					id: entity.id,
					changeCategory: changeCategory,
					reason: reason,
					changeReferenceUrl: changeReferenceUrl,
					...changedFields,
					// Add any other fields needed for the update
				},
			},
		});

		if (data?.[updateName]) {
			setEditMode(false);
			setChangedFields({});
			// Refetch the data for the updated entity
			client.refetchQueries({
				include: [`Load${entity.constructor.name}`],
			});

			setAlert({
				open: true,
				severity: "success",
				text: t("ui.data_grid.edit_success", {
					entity: t(`entities.${entity.constructor.name.toLowerCase()}.one`),
					name: entity.name ?? entity.id, // Use name if available, fall back to id if not
				}),
				title: t("ui.data_grid.updated"),
			});
		}
	} catch (error) {
		console.error(`Error updating ${entity.constructor.name}:`, error);
		setAlert({
			open: true,
			severity: "error",
			text: t("ui.data_grid.edit_error", {
				entity: t(`entities.${entity.constructor.name.toLowerCase()}.one`),
				name: entity.name ?? entity.id,
			}),
			title: t("ui.data_grid.updated"),
		});
	} finally {
		setConfirmationEdit(false);
	}
};

export const closeConfirmation = (
	setConfirmation: Dispatch<SetStateAction<boolean>>,
	client: ApolloClient<object>,
	entityName: string,
	setConfirmationEdit?: Dispatch<SetStateAction<boolean>>,
	setPickupConfirmation?: Dispatch<SetStateAction<boolean>>,
	setConfirmationDeletion?: Dispatch<SetStateAction<boolean>>,
) => {
	// Implementation
	setConfirmation(false);
	if (setConfirmationEdit) {
		setConfirmationEdit(false);
	}
	if (setPickupConfirmation) {
		setPickupConfirmation(false);
	}
	if (setConfirmationDeletion) {
		setConfirmationDeletion(false);
	}
	client.refetchQueries({
		include: [`Load${entityName}`], // Replace with the appropriate query name
	});
};

export const updateField = (
	field: keyof any,
	value: any,
	setEditableFields: Dispatch<SetStateAction<any>>,
	setChangedFields: Dispatch<SetStateAction<any>>,
	entity: any,
) => {
	setEditableFields((prev: any) => ({
		...prev,
		[field]: value,
	}));
	if (value !== entity[field]) {
		if (isEmpty(value) && entity[field] == null) {
			// To ensure that empty values and null values are not mistakenly identified as different.
			// i.e the field may be null when we get it from the server
			// but value may be empty when we get it from the editable attribute
			// this stops that being identified as a user change
			setChangedFields((prev: any) => {
				const newChangedFields = { ...prev };
				delete newChangedFields[field];
				return newChangedFields;
			});
		} else {
			setChangedFields((prev: any) => ({
				...prev,
				[field]: value,
			}));
		}
	} else {
		// No change, throw away
		setChangedFields((prev: any) => {
			const newChangedFields = { ...prev };
			delete newChangedFields[field];
			return newChangedFields;
		});
	}
};

// const updateField = (field: keyof Location, value: string | number | null) => {
// 	setEditableFields((prev) => ({
// 		...prev,
// 		[field]: value,
// 	}));

// 	if (value !== location[field]) {
// 		setChangedFields((prev) => ({
// 			...prev,
// 			[field]: value,
// 		}));
// 	} else {
// 		setChangedFields((prev) => {
// 			const newChangedFields = { ...prev };
// 			delete newChangedFields[field];
// 			return newChangedFields;
// 		});
// 	}
// };

export const handleCancellation = (
	setEditMode: Dispatch<SetStateAction<boolean>>,
	setEditableFields: any,
	entity: any,
	setChangedFields: Dispatch<SetStateAction<any>>,
	setDirty: Dispatch<SetStateAction<boolean>>,
	setValidationError: Dispatch<SetStateAction<boolean>>,
	setEditKey: Dispatch<SetStateAction<number>>,
) => {
	setEditMode(false);
	// if this does not work then just pass in the editable fields manually
	setEditableFields(
		entity
			? Object.fromEntries(
					Object.entries(entity).filter(([key]) => !key.startsWith("__")),
				)
			: {},
	);
	setChangedFields({});
	setDirty(false);
	setValidationError(false);
	setEditKey((prevKey) => prevKey + 1);
};

export const handleEdit = (
	entity: any,
	setEditMode: Dispatch<SetStateAction<boolean>>,
	setEditableFields: Dispatch<SetStateAction<any>>,
	firstEditableFieldRef: RefObject<HTMLInputElement>,
) => {
	setEditableFields(
		entity
			? Object.fromEntries(
					Object.entries(entity).filter(([key]) => !key.startsWith("__")),
				)
			: {},
	);
	setEditMode(true);
	setTimeout(() => {
		if (firstEditableFieldRef.current) {
			firstEditableFieldRef.current.focus();
		}
	}, 0);
};

export const handleSave = (
	changedFields: any,
	setEditMode: Dispatch<SetStateAction<boolean>>,
	setConfirmationEdit: Dispatch<SetStateAction<boolean>>,
) => {
	console.log("HANDLE SAVE", changedFields);
	// NO CHANGED FIELDS
	if (Object.keys(changedFields).length === 0) {
		console.log("WAARIO");
		setEditMode(false);
		return;
	}
	setConfirmationEdit(true);
};
