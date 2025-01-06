export const mappingsCategoryConverter = (category: string): string => {
	switch (category) {
		case "ItemType":
			return "item type";
		case "Location":
			return "location";
		case "patronType":
			return "patronType";
		default:
			return "";
	}
};
