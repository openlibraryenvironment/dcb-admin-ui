export const checkValidFileType = async (
	file: File,
	allowedTypes: object,
): Promise<boolean> => {
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

	// We could also check content in case someone has changed their file's extension or MIME type
	// if (
	// 	Object.values(allowedTypes)
	// 		.flat()
	// 		.some((ext) => fileName.endsWith(ext))
	// ) {
	// 	return true;
	// }
	// // And if it passes all that, check file content also
	// const isValidContent = await verifyFileContent(file);
	// return isValidContent;
};

// const verifyFileContent = async (file: File): Promise<boolean> => {
// 	return new Promise((resolve) => {
// 		const reader = new FileReader();
// 		reader.onload = (e) => {
// 			const content = e.target?.result as string;
// 			// Check if content starts with valid CSV/TSV patterns
// 			// This is a basic check - you might want to make it more sophisticated
// 			const firstLine = content.split("\n")[0];
// 			const isCsvPattern = firstLine.includes(",");
// 			const isTsvPattern = firstLine.includes("\t");
// 			resolve(isCsvPattern || isTsvPattern);
// 		};
// 		reader.readAsText(file.slice(0, 1024)); // Read only first 1KB to check pattern
// 	});
// };
