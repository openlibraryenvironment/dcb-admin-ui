// Types of data grid where pre-sets are in effect.
export const presetTypes = [
	"circulationStatus",
	"patronRequestsLibraryException",
	"patronRequestsLibraryActive",
	"patronRequestsLibraryOutOfSequence",
	"patronRequestsLibraryCompleted",
	"referenceValueMappingsForLibrary",
	"numericRangeMappingsForLibrary",
	"referenceValueMappings",
	"numericRangeMappings",
];

// Types of data grid where users cannot click through to a details page
export const nonClickableTypes = [
	"referenceValueMappings",
	"circulationStatus",
	"numericRangeMappings",
	"referenceValueMappingsForLibrary",
	"numericRangeMappingsForLibrary",
];

// Types of data grid where users can click through to a details page,
// but where special redirection is needed to get the correct URL
export const specialRedirectionTypes = [
	"patronRequestsLibraryActive",
	"patronRequestsLibraryOutOfSequence",
	"patronRequestsLibraryCompleted",
	"patronRequestsLibraryException",
	"dataChangeLog",
];

// Types of data grid where we show the actions menu to the user.
export const actionsTypes = [
	"libraries",
	"locations",
	"referenceValueMappings",
	"numericRangeMappings",
	"referenceValueMappingsForLibrary",
	"numericRangeMappingsForLibrary",
];

// Map for quick filter (search) values for different types of data grid
// i.e. these are the attributes the quick filter searches by for each type of grid
export const quickFieldMap: Record<string, string> = {
	bibs: "sourceRecordId",
	patronRequests: "errorMessage",
	patronRequestsLibraryException: "errorMessage",
	patronRequestsLibraryOutOfSequence: "status",
	patronRequestsLibraryActive: "status",
	patronRequestsLibraryCompleted: "status",
	circulationStatus: "fromContext",
	referenceValueMappings: "fromCategory",
	referenceValueMappingsForLibrary: "fromCategory",
	numericRangeMappings: "domain",
	numericRangeMappingsForLibrary: "domain",
	libraries: "fullName",
	agencies: "name",
	groups: "name",
	hostlmss: "name",
	locations: "name",
	dataChangeLog: "actionInfo",
	default: "id",
};
