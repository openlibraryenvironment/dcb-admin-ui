import { ApolloClient } from "@apollo/client";
import { TFunction } from "i18next";
import { NextRouter } from "next/router";
import { Dispatch, RefObject, SetStateAction } from "react";
import { UseFormReset } from "react-hook-form";

/**
 * Generic function to handle confirmation and saving of entity changes
 * @param entityId - ID of the entity being updated
 * @param changedFields - Object containing the changed field values
 * @param updateMutation - Apollo mutation function to execute
 * @param client - Apollo client for refetching queries
 * @param setters - Object containing state setters
 * @param displayInfo - Object containing display information
 * @param changeMetadata - Object containing metadata about the change
 * @param refetchQueries - Array of query names to refetch
 * @param storeUpdates - Optional function to update any external stores with new values
 * @param reset - Optional form reset function from react-hook-form
 * @param resetValues - Optional values to use when resetting the form
 */
export const handleSaveConfirmation = async (
	entityId: string,
	changedFields: any,
	updateMutation: any,
	client: ApolloClient<object>,
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
	refetchQueries: string[],
	reset: UseFormReset<any>,
	resetOptions?: string[],
	storeUpdates?: (changedFields: any) => void,
) => {
	const { setEditMode, setChangedFields, setAlert, setConfirmation } = setters;
	const { entityName, entityType, mutationName, t } = displayInfo;
	const { reason, changeCategory, changeReferenceUrl } = changeMetadata;

	try {
		// Update store values if provided (for UI consistency before refetch)
		if (storeUpdates) {
			storeUpdates(changedFields);
		}
		const { data } = await updateMutation({
			variables: {
				input: {
					id: entityId,
					...changedFields,
					reason,
					changeCategory,
					changeReferenceUrl,
				},
			},
		});

		// Check if mutation was successful
		if (data?.[mutationName]) {
			setEditMode(false);
			setChangedFields({});

			// Refetch queries to update data
			if (refetchQueries.length > 0) {
				await client.refetchQueries({
					include: refetchQueries,
				});
			}

			// Reset the form with the latest data
			// Otherwise react-hook-form may believe it's still dirty
			// And unsaved changes warning will pop up

			if (resetOptions && resetOptions.length > 0) {
				const responseData = data[mutationName];
				// Create an object with only the fields we want to reset from the response
				const fieldsToReset = resetOptions.reduce(
					(acc, fieldName) => {
						if (responseData && fieldName in responseData) {
							acc[fieldName] = responseData[fieldName];
						}
						return acc;
					},
					{} as Record<string, any>,
				);

				// Reset form with the selected fields from the response
				if (Object.keys(fieldsToReset).length > 0) {
					console.log(fieldsToReset);
					reset(fieldsToReset, { keepValues: false });
				} else {
					// Fall back to standard reset if no fields were found in the response
					reset();
				}
			} else {
				console.log("Standard reset");
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
		}
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
		// Close any confirmation dialogs
		if (setConfirmation) {
			setConfirmation(false);
		}
	}
};

export const closeConfirmation = (
	setConfirmation: Dispatch<SetStateAction<boolean>>,
	client: ApolloClient<object>,
	refetchQuery: string,
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
		include: [`${refetchQuery}`],
	});
};

/**
 * Handle cancellation of editing mode
 * @param setters - Object containing state setters
 * @param reset - Form reset function from react-hook-form
 * @param resetValues - Specific values to reset the form to (optional)
 */
export const handleCancel = (
	setters: {
		setEditMode: Dispatch<SetStateAction<boolean>>;
		setChangedFields: Dispatch<SetStateAction<any>>;
	},
	reset: UseFormReset<any>,
	resetValues?: any,
) => {
	const { setEditMode, setChangedFields } = setters;
	setEditMode(false);
	setChangedFields({});

	if (resetValues) {
		reset(resetValues, { keepValues: false });
	} else {
		reset();
	}
};

export const handleEdit =
	(
		setEditMode: Dispatch<SetStateAction<boolean>>,
		firstEditableFieldRef: RefObject<HTMLInputElement>,
	) =>
	() => {
		setEditMode(true);
		setTimeout(() => {
			if (firstEditableFieldRef.current) {
				firstEditableFieldRef.current.focus();
			}
		}, 0);
	};

export const handleDeleteEntity = async (
	id: string,
	reason: string,
	changeCategory: string,
	changeReferenceUrl: string,
	setAlert: Dispatch<SetStateAction<any>>,
	deleteMutation: any,
	t: TFunction<"common" | "application" | "validation">,
	router: NextRouter,
	name: string,
	operationType: string,
	redirect: string,
) => {
	try {
		const input = {
			id: id,
			reason: reason,
			changeCategory: changeCategory,
			changeReferenceUrl: changeReferenceUrl,
		};
		const { data } = await deleteMutation({
			variables: {
				input,
			},
			update(
				cache: {
					modify: (arg0: {
						fields:
							| { libraries(_: any, { DELETE }: { DELETE: any }): any }
							| { locations(_: any, { DELETE }: { DELETE: any }): any };
					}) => void;
				},
				{ data: mutationData }: any,
			) {
				// This will remove cached libraries if the delete is successful.
				// Thus forcing them to be re-fetched before re-direction to the libraries page.
				// based on type
				switch (operationType) {
					case "deleteLibrary":
						if (mutationData?.deleteLibrary.success) {
							cache.modify({
								fields: {
									libraries(_, { DELETE }) {
										return DELETE;
									},
								},
							});
						}
						break;
					case "deleteLocation":
						if (mutationData?.deleteLocation.success) {
							cache.modify({
								fields: {
									locations(_, { DELETE }) {
										return DELETE;
									},
								},
							});
						}
				}
			},
		});
		if (data?.[operationType].success == true) {
			switch (operationType) {
				case "deleteLibrary":
					console.log("Attempting to set alert");
					setAlert({
						open: true,
						severity: "success",
						text: t("ui.data_grid.delete_success", {
							entity: t("libraries.library").toLowerCase(),
							name: name,
						}),
						title: t("ui.data_grid.deleted"),
					});
					console.log("Entity deleted successfully");
					setTimeout(() => {
						router.push(redirect);
					}, 100);
					break;
				case "deleteLocation":
					setAlert({
						open: true,
						severity: "success",
						text: t("ui.data_grid.delete_success", {
							entity: t("locations.location_one").toLowerCase(),
							name: name,
						}),
						title: t("ui.data_grid.deleted"),
					});
					console.log("Entity deleted successfully");
					setTimeout(() => {
						router.push(redirect);
					}, 100);
					break;
			}
		} else {
			console.log("Failed to delete entity");
			switch (operationType) {
				case "deleteLibrary":
					setAlert({
						open: true,
						severity: "error",
						text: t("ui.data_grid.delete_error", {
							entity: t("libraries.library").toLowerCase(),
						}),
					});
					break;
				case "deleteLocation":
					setAlert({
						open: true,
						severity: "error",
						text: t("ui.data_grid.delete_error", {
							entity: t("locations.location_one").toLowerCase(),
						}),
					});
					break;
			}
		}
	} catch (error) {
		console.error("Error deleting entity:", error);
		switch (operationType) {
			case "deleteLibrary":
				setAlert({
					open: true,
					severity: "error",
					text: t("ui.data_grid.delete_error", {
						entity: t("libraries.library").toLowerCase(),
					}),
				});
				break;
			case "deleteLocation":
				setAlert({
					open: true,
					severity: "error",
					text: t("ui.data_grid.delete_error", {
						entity: t("locations.location_one").toLowerCase(),
					}),
				});
				break;
		}
	}
};
