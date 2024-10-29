export const checkValidFileType = (
	file: File,
	allowedTypes: object,
): boolean => {
	// Check the MIME types
	const validMimeTypes = Object.keys(allowedTypes);
	if (validMimeTypes.includes(file.type)) {
		return true;
	}
	// If that's not clear, check the file name
	const fileName = file.name.toLowerCase();
	return Object.values(allowedTypes)
		.flat()
		.some((ext) => fileName.endsWith(ext));
	// We could also check the first KB of the file's contents for further validation if required.
};
