export const getFileName = (fileRef: React.RefObject<HTMLInputElement>) => {
	return fileRef.current?.files?.[0]?.name ?? "mappings.no_file_selected";
};
