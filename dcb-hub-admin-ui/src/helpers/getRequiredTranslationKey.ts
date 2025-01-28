export const getRequiredTranslationKey = (field: string): string => {
	switch (field) {
		case "fullName":
			return "libraries.name";
		case "shortName":
			return "libraries.short_name";
		case "abbreviatedName":
			return "libraries.abbreviated_name";
		default:
			return "";
	}
};
