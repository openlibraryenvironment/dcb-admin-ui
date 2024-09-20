type EntityType = Record<string, any>;

export function formatChangedFields<T extends EntityType>(
	changedFields: Partial<T>,
	originalFields: Partial<T>,
): string {
	const formattedChanges: {
		new_values: Record<string, any>;
		old_values: Record<string, any>;
	} = {
		new_values: {},
		old_values: {},
	};

	Object.entries(changedFields).forEach(([key, newValue]) => {
		const oldValue = originalFields[key];

		formattedChanges.new_values[key] = newValue;
		formattedChanges.old_values[key] = oldValue;
	});

	return JSON.stringify(formattedChanges);
}
