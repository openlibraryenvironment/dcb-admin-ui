import { ApolloClient } from "@apollo/client";
import { TFunction } from "i18next";
import { isEmpty } from "lodash";
import { NextRouter } from "next/router";
import { Dispatch, RefObject, SetStateAction } from "react";

export const handleSaveConfirmation = async (
	entity: any,
	changedFields: any,
	updateEntity: any,
	client: ApolloClient<object>,
	setEditMode: Dispatch<SetStateAction<boolean>>,
	setChangedFields: Dispatch<SetStateAction<any>>,
	setAlert: Dispatch<SetStateAction<any>>,
	setDirty: Dispatch<SetStateAction<boolean>>,
	setConfirmationEdit: Dispatch<SetStateAction<any>>,
	t: TFunction<"common" | "application" | "validation">,
	reason: string,
	changeCategory: string,
	changeReferenceUrl: string,
	updateName: string,
	entityType: string,
	refetchQuery: string,
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
				},
			},
		});

		if (data?.[updateName]) {
			setEditMode(false);
			setChangedFields({});
			setDirty(false);
			// Refetch the data for the updated entity
			client.refetchQueries({
				include: [refetchQuery],
			});

			setAlert({
				open: true,
				severity: "success",
				text: t("ui.data_grid.edit_success", {
					entity: entityType,
					name: entity.name ?? (entity.fullName ? entity.fullName : entity.id), // Use name if available, fall back to id if not
				}),
				title: t("ui.data_grid.updated"),
			});
		}
	} catch (error) {
		console.error(
			`Error updating ${entity.name ?? (entity.fullName ? entity.fullName : entity.id)}:`,
			error,
		);
		setAlert({
			open: true,
			severity: "error",
			text: t("ui.data_grid.edit_error", {
				entity: entityType,
				name: entity.name ?? (entity.fullName ? entity.fullName : entity.id),
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

// export const updateField = (
// 	field: keyof any,
// 	value: any,
// 	setEditableFields: Dispatch<SetStateAction<any>>,
// 	setChangedFields: Dispatch<SetStateAction<any>>,
// 	entity: any,
// ) => {
// 	setEditableFields((prev: any) => ({
// 		...prev,
// 		[field]: value,
// 	}));

// 	// Use JSON.stringify to compare values more reliably
// 	const isChanged = JSON.stringify(value) !== JSON.stringify(entity[field]);

// 	if (isChanged) {
// 		setChangedFields((prev: any) => ({
// 			...prev,
// 			[field]: value,
// 		}));
// 	} else {
// 		setChangedFields((prev: any) => {
// 			const newChangedFields = { ...prev };
// 			delete newChangedFields[field];
// 			return newChangedFields;
// 		});
// 	}
// };

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
	// NO CHANGED FIELDS
	if (Object.keys(changedFields).length === 0) {
		setEditMode(false);
		return;
	}
	setConfirmationEdit(true);
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
