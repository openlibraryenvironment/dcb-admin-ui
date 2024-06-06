export const mergeThemeStyles = (baseStyles: any, overrides: any) => {
	const mergedStyles: any = {};

	const deepMerge = (base: any, override: any) => {
		const result = { ...base };

		Object.keys(override).forEach((key) => {
			if (
				typeof override[key] === "object" &&
				override[key] !== null &&
				!Array.isArray(override[key])
			) {
				result[key] = deepMerge(base[key] || {}, override[key]);
			} else {
				result[key] = override[key];
			}
		});

		return result;
	};

	// Merge base and overrides typography objects
	Object.keys(baseStyles).forEach((key) => {
		// If the key exists in both, merge them; otherwise, take the base style
		mergedStyles[key] =
			key in overrides
				? deepMerge(baseStyles[key], overrides[key])
				: baseStyles[key];
	});

	// Handle keys that are in overrides but not in baseStyles
	Object.keys(overrides).forEach((key) => {
		if (!(key in baseStyles)) {
			mergedStyles[key] = overrides[key];
		}
	});

	return mergedStyles;
};
