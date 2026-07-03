import { QueryClient } from "@tanstack/react-query";
import { AnyRouter } from "@tanstack/react-router";
import { TFunction } from "i18next";
import { Dispatch, RefObject, SetStateAction } from "react";
import { UseFormReset } from "react-hook-form";

export const handleSaveConfirmation = async (
	entityId: string,
	changedFields: any,
	updateMutation: (variables: any) => Promise<any>,
	queryClient: QueryClient,
	setters: {
		setEditMode: Dispatch<SetStateAction<boolean>>;
		setChangedFields: Dispatch<SetStateAction<any>>;
		setAlert: Dispatch<SetStateAction<any>>;
		setConfirmation?: Dispatch<SetStateAction<boolean>>;
	},
	displayInfo: {
		entityName: string;
		entityType: string;
		mutationName: string;
		t: TFunction<any>;
	},
	changeMetadata: {
		reason: string;
		changeCategory: string;
		changeReferenceUrl?: string;
	},
	queryKeysToInvalidate: unknown[][],
	reset: UseFormReset<any>,
	resetOptions?: string[],
	storeUpdates?: (changedFields: any) => void,
) => {
	const { setEditMode, setChangedFields, setAlert, setConfirmation } = setters;
	const { entityName, entityType, mutationName, t } = displayInfo;
	const { reason, changeCategory, changeReferenceUrl } = changeMetadata;

	const payload = {
		input: {
			...(mutationName === "updateAgency"
				? { code: entityId }
				: { id: entityId }),
			...changedFields,
			reason,
			changeCategory,
			changeReferenceUrl,
		},
	};

	try {
		if (storeUpdates) storeUpdates(changedFields);

		const response = await updateMutation(payload);
		const responseData = response?.[mutationName] || response;

		setEditMode(false);
		setChangedFields({});

		if (queryKeysToInvalidate.length > 0) {
			queryKeysToInvalidate.forEach((queryKey) => {
				queryClient.invalidateQueries({ queryKey });
			});
		}

		if (resetOptions && resetOptions.length > 0 && responseData) {
			const fieldsToReset = resetOptions.reduce(
				(acc, fieldName) => {
					if (fieldName in responseData)
						acc[fieldName] = responseData[fieldName];
					return acc;
				},
				{} as Record<string, any>,
			);

			if (Object.keys(fieldsToReset).length > 0) {
				reset(fieldsToReset, { keepValues: false });
			} else {
				reset();
			}
		} else {
			reset();
		}

		setAlert({
			open: true,
			severity: "success",
			text: t("ui.data_grid.edit_success", {
				entity: entityType,
				name: entityName,
			}),
			title: t("ui.data_grid.updated"),
		});
	} catch (error) {
		console.error(`Error updating ${entityType} ${entityName}:`, error);
		setAlert({
			open: true,
			severity: "error",
			text: t("ui.data_grid.edit_error", {
				entity: entityType,
				name: entityName,
			}),
			title: t("ui.data_grid.error"),
		});
	} finally {
		if (setConfirmation) setConfirmation(false);
	}
};

export const closeConfirmation = (
	setConfirmation: Dispatch<SetStateAction<boolean>>,
	queryClient: QueryClient,
	queryKeyToInvalidate: unknown[],
	setConfirmationEdit?: Dispatch<SetStateAction<boolean>>,
	setPickupConfirmation?: Dispatch<SetStateAction<boolean>>,
	setConfirmationDeletion?: Dispatch<SetStateAction<boolean>>,
) => {
	setConfirmation(false);
	if (setConfirmationEdit) setConfirmationEdit(false);
	if (setPickupConfirmation) setPickupConfirmation(false);
	if (setConfirmationDeletion) setConfirmationDeletion(false);

	queryClient.invalidateQueries({ queryKey: queryKeyToInvalidate });
};

export const handleCancel = (
	setters: {
		setEditMode: Dispatch<SetStateAction<boolean>>;
		setChangedFields: Dispatch<SetStateAction<any>>;
	},
	reset: UseFormReset<any>,
	resetValues?: any,
) => {
	setters.setEditMode(false);
	setters.setChangedFields({});
	if (resetValues) {
		reset(resetValues, { keepValues: false });
	} else {
		reset();
	}
};

export const handleEdit =
	(
		setEditMode: Dispatch<SetStateAction<boolean>>,
		firstEditableFieldRef: RefObject<HTMLInputElement | null>,
	) =>
	() => {
		setEditMode(true);
		requestAnimationFrame(() => {
			if (firstEditableFieldRef.current) {
				firstEditableFieldRef.current.focus();
			}
		});
	};

export const handleDeleteEntity = async (
	id: string,
	reason: string,
	changeCategory: string,
	changeReferenceUrl: string,
	setAlert: Dispatch<SetStateAction<any>>,
	deleteMutation: (variables: any) => Promise<any>,
	t: TFunction<any>,
	router: AnyRouter,
	name: string,
	operationType: string,
	redirect: string,
) => {
	try {
		const input = { id, reason, changeCategory, changeReferenceUrl };
		const response = await deleteMutation({ input });
		const success = response?.[operationType]?.success ?? true;

		if (success) {
			setAlert({
				open: true,
				severity: "success",
				text: t("ui.data_grid.delete_success", { entity: name }),
				title: t("ui.data_grid.deleted"),
			});

			setTimeout(() => {
				router.navigate({ to: redirect });
			}, 100);
		} else {
			throw new Error("Deletion failed on the server");
		}
	} catch (error) {
		console.error("Error deleting entity:", error);
		setAlert({
			open: true,
			severity: "error",
			text: t("ui.data_grid.delete_error", { entity: name }),
		});
	}
};
