// Function to get filename based on filters
export const getFileNameForExport = (type: string, filterOptions: any) => {
	const baseFileName = `${type}_export`;
	if (filterOptions) {
		const filterSuffix = filterOptions.replace(/\s+/g, "_").slice(0, 50); // Limit length
		return `${baseFileName}_${filterSuffix}`;
	}
	return baseFileName;
};
