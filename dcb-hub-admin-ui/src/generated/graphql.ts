/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> =
	| T
	| {
			[P in keyof T]?: P extends " $fragmentName" | "__typename" ? T[P] : never;
	  };
export type AddLibraryToGroupCommand = {
	library: string | number;
	libraryGroup: string | number;
};

export type ConsortiumContactInput = {
	changeCategory: string;
	changeReferenceUrl?: string | null | undefined;
	consortiumId: string;
	email: string;
	firstName: string;
	isPrimaryContact: boolean;
	lastName: string;
	reason: string;
	role: string;
};

export type CreateHostLmsInput = {
	changeCategory?: string | null | undefined;
	changeReferenceUrl?: string | null | undefined;
	clientConfig?: Record<string, any> | null | undefined;
	code: string;
	ingestSourceClass?: string | null | undefined;
	itemSuppressionRulesetName?: string | null | undefined;
	lmsClientClass: string;
	name?: string | null | undefined;
	reason?: string | null | undefined;
	suppressionRulesetName?: string | null | undefined;
};

export type CreateLibraryContactInput = {
	changeCategory: string;
	changeReferenceUrl?: string | null | undefined;
	email: string;
	firstName: string;
	isPrimaryContact: boolean;
	lastName: string;
	libraryId: string;
	reason: string;
	role: string;
};

export type CreateLocationInput = {
	agencyCode: string;
	changeCategory?: string | null | undefined;
	changeReferenceUrl?: string | null | undefined;
	code: string;
	deliveryStops: string;
	hostLmsCode: string;
	isEnabledForPickupAnywhere?: boolean | null | undefined;
	isPickup: boolean;
	latitude: number;
	localId?: string | null | undefined;
	longitude: number;
	name: string;
	printLabel: string;
	reason?: string | null | undefined;
	type: string;
};

export type CreateReferenceValueMappingInput = {
	changeCategory?: string | null | undefined;
	changeReferenceUrl?: string | null | undefined;
	fromCategory: string;
	fromContext: string;
	fromValue: string;
	reason?: string | null | undefined;
	toCategory: string;
	toContext: string;
	toValue: string;
};

export type DeleteConsortiumContactInput = {
	changeCategory?: string | null | undefined;
	changeReferenceUrl?: string | null | undefined;
	consortiumId: string | number;
	personId: string | number;
	reason?: string | null | undefined;
};

export type DeleteEntityInput = {
	changeCategory?: string | null | undefined;
	changeReferenceUrl?: string | null | undefined;
	id: string | number;
	reason?: string | null | undefined;
};

export type DeleteLibraryContactInput = {
	changeCategory?: string | null | undefined;
	changeReferenceUrl?: string | null | undefined;
	libraryId: string | number;
	personId: string | number;
	reason?: string | null | undefined;
};

export type FunctionalSettingInput = {
	changeCategory?: string | null | undefined;
	changeReferenceUrl?: string | null | undefined;
	consortiumName?: string | null | undefined;
	description?: string | null | undefined;
	enabled: boolean;
	id?: string | number | null | undefined;
	name: FunctionalSettingType;
	reason?: string | null | undefined;
};

export type FunctionalSettingType =
	| "DENY_LIBRARY_MAPPING_EDIT"
	| "OWN_LIBRARY_BORROWING"
	| "PICKUP_ANYWHERE"
	| "RE_RESOLUTION"
	| "SELECT_UNAVAILABLE_ITEMS"
	| "TRIGGER_SUPPLIER_RENEWAL"
	| "VIRTUAL_PATRON_NAMES_POLARIS"
	| "VIRTUAL_PATRON_NAMES_VISIBLE";

export type LibraryGroupInput = {
	changeCategory?: string | null | undefined;
	changeReferenceUrl?: string | null | undefined;
	code: string;
	id?: string | number | null | undefined;
	name: string;
	reason?: string | null | undefined;
	type: string;
};

export type LibraryInput = {
	abbreviatedName: string;
	address: string;
	agencyCode: string;
	authProfile?: string | null | undefined;
	backupDowntimeSchedule?: string | null | undefined;
	changeCategory?: string | null | undefined;
	changeReferenceUrl?: string | null | undefined;
	contacts: Array<PersonInput | null | undefined>;
	discoverySystem?: string | null | undefined;
	fullName: string;
	hostLmsCode: string;
	hostLmsConfiguration?: string | null | undefined;
	id?: string | number | null | undefined;
	isBorrowingAgency?: boolean | null | undefined;
	isSupplyingAgency?: boolean | null | undefined;
	latitude?: number | null | undefined;
	longitude?: number | null | undefined;
	maxConsortialLoans?: number | null | undefined;
	patronWebsite?: string | null | undefined;
	reason?: string | null | undefined;
	shortName: string;
	supportHours?: string | null | undefined;
	targetLoanToBorrowRatio?: string | null | undefined;
	type: string;
};

export type PersonInput = {
	email: string;
	firstName: string;
	id?: string | number | null | undefined;
	isPrimaryContact: boolean;
	lastName: string;
	role: string;
};

export type ProcessingStatus = "FAILURE" | "PROCESSING_REQUIRED" | "SUCCESS";

export type RenewalStatus =
	"ALLOWED" | "DISALLOWED" | "UNKNOWN" | "UNSUPPORTED";

export type UpdateAgencyInput = {
	changeCategory?: string | null | undefined;
	changeReferenceUrl?: string | null | undefined;
	code: string;
	isBorrowingAgency?: boolean | null | undefined;
	isSupplyingAgency?: boolean | null | undefined;
	latitude?: number | null | undefined;
	longitude?: number | null | undefined;
	maxConsortialLoans?: number | null | undefined;
	reason?: string | null | undefined;
};

export type UpdateAgencyParticipationInput = {
	changeCategory?: string | null | undefined;
	changeReferenceUrl?: string | null | undefined;
	code: string;
	isBorrowingAgency?: boolean | null | undefined;
	isSupplyingAgency?: boolean | null | undefined;
	reason?: string | null | undefined;
};

export type UpdateConsortiumInput = {
	aboutImageUploader?: string | null | undefined;
	aboutImageUploaderEmail?: string | null | undefined;
	aboutImageUrl?: string | null | undefined;
	catalogueSearchUrl?: string | null | undefined;
	changeCategory: string;
	changeReferenceUrl?: string | null | undefined;
	contacts?: Array<UpdatePersonInput | null | undefined> | null | undefined;
	description?: string | null | undefined;
	displayName?: string | null | undefined;
	headerImageUploader?: string | null | undefined;
	headerImageUploaderEmail?: string | null | undefined;
	headerImageUrl?: string | null | undefined;
	id: string | number;
	reason: string;
	websiteUrl?: string | null | undefined;
};

export type UpdateFunctionalSettingInput = {
	changeCategory?: string | null | undefined;
	changeReferenceUrl?: string | null | undefined;
	description?: string | null | undefined;
	enabled?: boolean | null | undefined;
	id: string | number;
	name?: FunctionalSettingType | null | undefined;
	reason?: string | null | undefined;
};

export type UpdateLibraryInput = {
	abbreviatedName?: string | null | undefined;
	address?: string | null | undefined;
	backupDowntimeSchedule?: string | null | undefined;
	changeCategory?: string | null | undefined;
	changeReferenceUrl?: string | null | undefined;
	discoverySystem?: string | null | undefined;
	fullName?: string | null | undefined;
	id: string | number;
	latitude?: number | null | undefined;
	longitude?: number | null | undefined;
	patronWebsite?: string | null | undefined;
	principalLabel?: string | null | undefined;
	reason?: string | null | undefined;
	secretLabel?: string | null | undefined;
	shortName?: string | null | undefined;
	supportHours?: string | null | undefined;
	targetLoanToBorrowRatio?: string | null | undefined;
	type?: string | null | undefined;
};

export type UpdateLocationInput = {
	changeCategory?: string | null | undefined;
	changeReferenceUrl?: string | null | undefined;
	id: string | number;
	isEnabledForPickupAnywhere?: boolean | null | undefined;
	isPickup?: boolean | null | undefined;
	latitude?: number | null | undefined;
	localId?: string | null | undefined;
	longitude?: number | null | undefined;
	name?: string | null | undefined;
	printLabel?: string | null | undefined;
	reason?: string | null | undefined;
};

export type UpdateNumericRangeMappingInput = {
	changeCategory?: string | null | undefined;
	changeReferenceUrl?: string | null | undefined;
	id: string | number;
	mappedValue?: string | null | undefined;
	reason?: string | null | undefined;
};

export type UpdatePersonInput = {
	changeCategory?: string | null | undefined;
	changeReferenceUrl?: string | null | undefined;
	email?: string | null | undefined;
	firstName?: string | null | undefined;
	id: string | number;
	isPrimaryContact?: boolean | null | undefined;
	lastName?: string | null | undefined;
	reason?: string | null | undefined;
	role?: string | null | undefined;
};

export type UpdateReferenceValueMappingInput = {
	changeCategory?: string | null | undefined;
	changeReferenceUrl?: string | null | undefined;
	id: string | number;
	reason?: string | null | undefined;
	toValue?: string | null | undefined;
};

export type PatronRequestFieldsFragment = {
	id: string;
	dateCreated: string | null;
	dateUpdated: string | null;
	patronHostlmsCode: string | null;
	pickupLocationCode: string | null;
	description: string | null;
	status: string | null;
	previousStatus: string | null;
	nextExpectedStatus: string | null;
	errorMessage: string | null;
	outOfSequenceFlag: boolean | null;
	elapsedTimeInCurrentStatus: number | null;
	pollCountForCurrentStatus: number | null;
	renewalCount: number | null;
	resolutionCount: number | null;
	isManuallySelectedItem: boolean | null;
	requesterNote: string | null;
	activeWorkflow: string | null;
	pickupRequestId: string | null;
	pickupRequestStatus: string | null;
	pickupItemId: string | null;
	isExpeditedCheckout: boolean | null;
	rawLocalRequestStatus: string | null;
	rawLocalItemStatus: string | null;
	localRequestId: string | null;
	localRequestStatus: string | null;
	localItemId: string | null;
	localItemStatus: string | null;
	localItemType: string | null;
	patron: { id: string } | null;
	requestingIdentity: {
		id: string;
		localId: string | null;
		localBarcode: string | null;
		canonicalPtype: string | null;
	} | null;
	suppliers: Array<{
		id: string;
		canonicalItemType: string | null;
		dateCreated: string | null;
		dateUpdated: string | null;
		hostLmsCode: string | null;
		isActive: boolean | null;
		localItemId: string | null;
		localBibId: string | null;
		localItemBarcode: string | null;
		localItemLocationCode: string | null;
		localItemStatus: string | null;
		localItemType: string | null;
		localId: string | null;
		localRenewalCount: number | null;
		localStatus: string | null;
		localAgency: string | null;
		rawLocalItemStatus: string | null;
		rawLocalStatus: string | null;
	} | null> | null;
	clusterRecord: {
		id: string;
		title: string | null;
		members: Array<{ publisher: string | null } | null> | null;
	} | null;
};

export type AddFunctionalSettingMutationVariables = Exact<{
	input: FunctionalSettingInput;
}>;

export type AddFunctionalSettingMutation = {
	createFunctionalSetting: {
		id: string;
		name: FunctionalSettingType;
		enabled: boolean;
		description: string | null;
	};
};

export type AddLibraryToGroupMutationVariables = Exact<{
	input: AddLibraryToGroupCommand;
}>;

export type AddLibraryToGroupMutation = {
	addLibraryToGroup: {
		id: string;
		library: {
			id: string;
			agencyCode: string | null;
			fullName: string | null;
		} | null;
		libraryGroup: {
			id: string;
			code: string;
			name: string;
			type: string;
		} | null;
	};
};

export type CreateConsortiumContactMutationVariables = Exact<{
	input: ConsortiumContactInput;
}>;

export type CreateConsortiumContactMutation = {
	createContact: {
		id: string | null;
		person: { firstName: string | null; lastName: string | null } | null;
		consortium: { id: string } | null;
	};
};

export type CreateHostLmsMutationVariables = Exact<{
	input: CreateHostLmsInput;
}>;

export type CreateHostLmsMutation = {
	createHostLms: {
		pingStatus: string | null;
		ingestStatus: string | null;
		warnings: Array<string | null> | null;
		hostLms: {
			id: string | null;
			code: string | null;
			name: string | null;
			lmsClientClass: string | null;
		} | null;
	} | null;
};

export type CreateLibraryMutationVariables = Exact<{
	input: LibraryInput;
}>;

export type CreateLibraryMutation = {
	createLibrary: {
		id: string;
		agencyCode: string | null;
		fullName: string | null;
		shortName: string | null;
	};
};

export type CreateLibraryContactMutationVariables = Exact<{
	input: CreateLibraryContactInput;
}>;

export type CreateLibraryContactMutation = {
	createLibraryContact: {
		id: string | null;
		person: { firstName: string | null; lastName: string | null } | null;
		library: { id: string } | null;
	};
};

export type CreateLibraryGroupMutationVariables = Exact<{
	input: LibraryGroupInput;
}>;

export type CreateLibraryGroupMutation = {
	createLibraryGroup: { id: string; code: string; name: string; type: string };
};

export type CreateLocationMutationVariables = Exact<{
	input: CreateLocationInput;
}>;

export type CreateLocationMutation = {
	createLocation: { id: string; name: string | null };
};

export type CreateReferenceValueMappingMutationVariables = Exact<{
	input: CreateReferenceValueMappingInput;
}>;

export type CreateReferenceValueMappingMutation = {
	createReferenceValueMapping: { id: string; toValue: string | null };
};

export type DeleteConsortiumContactMutationVariables = Exact<{
	input: DeleteConsortiumContactInput;
}>;

export type DeleteConsortiumContactMutation = {
	deleteContact: { success: boolean; message: string | null };
};

export type DeleteLibraryMutationVariables = Exact<{
	input: DeleteEntityInput;
}>;

export type DeleteLibraryMutation = {
	deleteLibrary: { success: boolean; message: string | null };
};

export type DeleteLibraryContactMutationVariables = Exact<{
	input: DeleteLibraryContactInput;
}>;

export type DeleteLibraryContactMutation = {
	deleteLibraryContact: { success: boolean; message: string | null };
};

export type DeleteLocationMutationVariables = Exact<{
	input: DeleteEntityInput;
}>;

export type DeleteLocationMutation = {
	deleteLocation: { success: boolean; message: string | null };
};

export type DeleteNumericRangeMappingMutationVariables = Exact<{
	input: DeleteEntityInput;
}>;

export type DeleteNumericRangeMappingMutation = {
	deleteNumericRangeMapping: { success: boolean; message: string | null };
};

export type DeleteReferenceValueMappingMutationVariables = Exact<{
	input: DeleteEntityInput;
}>;

export type DeleteReferenceValueMappingMutation = {
	deleteReferenceValueMapping: { success: boolean; message: string | null };
};

export type UpdateAgencyMutationVariables = Exact<{
	input: UpdateAgencyInput;
}>;

export type UpdateAgencyMutation = {
	updateAgency: {
		id: string | null;
		code: string | null;
		name: string | null;
		isSupplyingAgency: boolean | null;
		isBorrowingAgency: boolean | null;
		maxConsortialLoans: number | null;
	};
};

export type UpdateAgencyParticipationStatusMutationVariables = Exact<{
	input: UpdateAgencyParticipationInput;
}>;

export type UpdateAgencyParticipationStatusMutation = {
	updateAgencyParticipationStatus: {
		id: string | null;
		code: string | null;
		name: string | null;
		isSupplyingAgency: boolean | null;
		isBorrowingAgency: boolean | null;
	};
};

export type UpdateConsortiumMutationVariables = Exact<{
	input: UpdateConsortiumInput;
}>;

export type UpdateConsortiumMutation = {
	updateConsortium: {
		id: string;
		headerImageUrl: string | null;
		headerImageUploader: string | null;
		headerImageUploaderEmail: string | null;
		aboutImageUrl: string | null;
		aboutImageUploader: string | null;
		aboutImageUploaderEmail: string | null;
		description: string | null;
		catalogueSearchUrl: string | null;
		websiteUrl: string | null;
	};
};

export type UpdateFunctionalSettingMutationVariables = Exact<{
	input: UpdateFunctionalSettingInput;
}>;

export type UpdateFunctionalSettingMutation = {
	updateFunctionalSetting: {
		id: string;
		name: FunctionalSettingType;
		enabled: boolean;
		description: string | null;
	};
};

export type UpdateLibraryMutationVariables = Exact<{
	input: UpdateLibraryInput;
}>;

export type UpdateLibraryMutation = {
	updateLibrary: {
		id: string;
		fullName: string | null;
		shortName: string | null;
		abbreviatedName: string | null;
		backupDowntimeSchedule: string | null;
		supportHours: string | null;
		latitude: number | null;
		longitude: number | null;
	};
};

export type UpdateLocationMutationVariables = Exact<{
	input: UpdateLocationInput;
}>;

export type UpdateLocationMutation = {
	updateLocation: {
		id: string;
		longitude: number | null;
		latitude: number | null;
		name: string | null;
		localId: string | null;
		printLabel: string | null;
		isPickup: boolean | null;
		isEnabledForPickupAnywhere: boolean | null;
	};
};

export type UpdateNumericRangeMappingMutationVariables = Exact<{
	input: UpdateNumericRangeMappingInput;
}>;

export type UpdateNumericRangeMappingMutation = {
	updateNumericRangeMapping: { id: string; mappedValue: string | null };
};

export type UpdatePersonMutationVariables = Exact<{
	input: UpdatePersonInput;
}>;

export type UpdatePersonMutation = {
	updatePerson: {
		id: string | null;
		email: string | null;
		firstName: string | null;
		lastName: string | null;
		isPrimaryContact: boolean | null;
		role: { id: string; name: string; displayName: string };
	};
};

export type UpdateReferenceValueMappingMutationVariables = Exact<{
	input: UpdateReferenceValueMappingInput;
}>;

export type UpdateReferenceValueMappingMutation = {
	updateReferenceValueMapping: { id: string; toValue: string | null };
};

export type CheckExistingLocationsQueryVariables = Exact<{
	pagesize: number;
	query: string;
}>;

export type CheckExistingLocationsQuery = {
	locations: { totalSize: number | null };
};

export type CheckExistingMappingsQueryVariables = Exact<{
	pagesize: number;
	query: string;
}>;

export type CheckExistingMappingsQuery = {
	referenceValueMappings: {
		totalSize: number | null;
		content: Array<{
			id: string;
			fromCategory: string | null;
			fromContext: string | null;
			fromValue: string | null;
			toCategory: string | null;
			toContext: string | null;
			toValue: string | null;
			reciprocal: boolean | null;
			label: string | null;
			lastImported: string | null;
			deleted: boolean | null;
		} | null> | null;
	};
};

export type CheckExistingNumericRangeMappingsQueryVariables = Exact<{
	pagesize: number;
	query: string;
}>;

export type CheckExistingNumericRangeMappingsQuery = {
	numericRangeMappings: {
		totalSize: number | null;
		content: Array<{
			id: string;
			context: string | null;
			domain: string | null;
			lowerBound: number | null;
			upperBound: number | null;
			targetContext: string | null;
			mappedValue: string | null;
			deleted: boolean | null;
			lastImported: string | null;
		} | null> | null;
	};
};

export type LoadAgenciesQueryVariables = Exact<{
	pageno: number;
	pagesize: number;
	order: string;
	query: string;
	orderBy: string;
}>;

export type LoadAgenciesQuery = {
	agencies: {
		totalSize: number | null;
		content: Array<{
			id: string | null;
			code: string | null;
			name: string | null;
			latitude: number | null;
			longitude: number | null;
		} | null> | null;
		pageable: { number: number | null; offset: number | null } | null;
	};
};

export type LoadAgenciesForStaffRequestQueryVariables = Exact<{
	pageno: number;
	pagesize: number;
	order: string;
	query: string;
	orderBy: string;
}>;

export type LoadAgenciesForStaffRequestQuery = {
	agencies: {
		totalSize: number | null;
		content: Array<{
			id: string | null;
			code: string | null;
			name: string | null;
			hostLms: { id: string | null; code: string | null } | null;
		} | null> | null;
		pageable: { number: number | null; offset: number | null } | null;
	};
};

export type LoadAgencyQueryVariables = Exact<{
	query: string;
}>;

export type LoadAgencyQuery = {
	agencies: {
		content: Array<{
			id: string | null;
			code: string | null;
			name: string | null;
			authProfile: string | null;
			longitude: number | null;
			latitude: number | null;
			isSupplyingAgency: boolean | null;
			isBorrowingAgency: boolean | null;
			hostLms: {
				id: string | null;
				code: string | null;
				name: string | null;
				lmsClientClass: string | null;
				clientConfig: Record<string, any> | null;
			} | null;
			locations: Array<{
				id: string;
				dateCreated: string | null;
				dateUpdated: string | null;
				code: string | null;
				name: string | null;
				type: string | null;
				isPickup: boolean | null;
				isEnabledForPickupAnywhere: boolean | null;
				longitude: number | null;
				latitude: number | null;
				locationReference: string | null;
				deliveryStops: string | null;
				printLabel: string | null;
				localId: string | null;
			} | null> | null;
		} | null> | null;
	};
};

export type LoadAlarmsQueryVariables = Exact<{
	pageno: number;
	pagesize: number;
	order: string;
	query: string;
	orderBy: string;
}>;

export type LoadAlarmsQuery = {
	alarms: {
		totalSize: number | null;
		content: Array<{
			id: string;
			code: string | null;
			created: string | null;
			lastSeen: string | null;
			repeatCount: number | null;
			expires: string | null;
			alarmDetails: Record<string, any> | null;
		} | null> | null;
		pageable: { number: number | null; offset: number | null } | null;
	};
};

export type GetAuditByIdQueryVariables = Exact<{
	query: string;
}>;

export type GetAuditByIdQuery = {
	audits: {
		content: Array<{
			id: string;
			auditDate: string | null;
			briefDescription: string | null;
			fromStatus: string | null;
			toStatus: string | null;
			auditData: Record<string, any> | null;
			patronRequest: { id: string } | null;
		} | null> | null;
	};
};

export type GetAuditsByPatronRequestQueryVariables = Exact<{
	pageno: number;
	pagesize: number;
	order: string;
	query: string;
	orderBy: string;
}>;

export type GetAuditsByPatronRequestQuery = {
	audits: {
		totalSize: number | null;
		content: Array<{
			id: string;
			auditDate: string | null;
			briefDescription: string | null;
			auditData: Record<string, any> | null;
			patronRequest: { id: string } | null;
		} | null> | null;
	};
};

export type LoadBibMainDetailsQueryVariables = Exact<{
	query: string;
}>;

export type LoadBibMainDetailsQuery = {
	sourceBibs: {
		content: Array<{
			id: string;
			dateCreated: string | null;
			dateUpdated: string | null;
			title: string | null;
			author: string | null;
			canonicalMetadata: Record<string, any> | null;
			processVersion: number | null;
			metadataScore: number | null;
			placeOfPublication: string | null;
			publisher: string | null;
			dateOfPublication: string | null;
			edition: string | null;
			isLargePrint: boolean | null;
			clusterReason: string | null;
			typeOfRecord: string | null;
			sourceSystemId: string | null;
			sourceRecordId: string | null;
			contributesTo: { id: string; title: string | null } | null;
			matchPoints: Array<{
				id: string;
				bibId: string;
				value: string;
			} | null> | null;
		} | null> | null;
	};
};

export type LoadBibSourceRecordQueryVariables = Exact<{
	query: string;
}>;

export type LoadBibSourceRecordQuery = {
	sourceBibs: {
		content: Array<{
			sourceRecord: {
				id: string;
				hostLmsId: string;
				remoteId: string;
				lastFetched: string;
				lastProcessed: string | null;
				processingState: ProcessingStatus | null;
				processingInformation: string | null;
				sourceRecordData: Record<string, any> | null;
			} | null;
		} | null> | null;
	};
};

export type LoadBibsQueryVariables = Exact<{
	pageno: number;
	pagesize: number;
	order: string;
	query: string;
}>;

export type LoadBibsQuery = {
	sourceBibs: {
		totalSize: number | null;
		content: Array<{
			id: string;
			dateCreated: string | null;
			dateUpdated: string | null;
			title: string | null;
			author: string | null;
			sourceSystemId: string | null;
			sourceRecordId: string | null;
			processVersion: number | null;
			isLargePrint: boolean | null;
			contributesTo: { id: string } | null;
		} | null> | null;
		pageable: { number: number | null; offset: number | null } | null;
	};
};

export type LoadBibsForPublisherQueryVariables = Exact<{
	query: string;
	pagesize?: number | null | undefined;
	pageno?: number | null | undefined;
}>;

export type LoadBibsForPublisherQuery = {
	sourceBibs: {
		content: Array<{ contributesTo: { id: string } | null } | null> | null;
	};
};

export type LoadClusterIdsByTitleQueryVariables = Exact<{
	query: string;
	pagesize?: number | null | undefined;
	pageno?: number | null | undefined;
}>;

export type LoadClusterIdsByTitleQuery = {
	sourceBibs: {
		content: Array<{ contributesTo: { id: string } | null } | null> | null;
	};
};

export type ClusterRecordsQueryVariables = Exact<{
	query: string;
}>;

export type ClusterRecordsQuery = {
	instanceClusters: {
		content: Array<{
			id: string;
			title: string | null;
			selectedBib: string | null;
			isDeleted: boolean | null;
			dateCreated: string | null;
			dateUpdated: string | null;
			lastIndexed: string | null;
			members: Array<{
				id: string;
				title: string | null;
				author: string | null;
				typeOfRecord: string | null;
				canonicalMetadata: Record<string, any> | null;
				clusterReason: string | null;
				sourceSystemId: string | null;
				sourceRecordId: string | null;
				sourceRecord: {
					id: string;
					hostLmsId: string;
					remoteId: string;
					lastFetched: string;
					lastProcessed: string | null;
					processingState: ProcessingStatus | null;
					processingInformation: string | null;
					sourceRecordData: Record<string, any> | null;
				} | null;
				matchPoints: Array<{ id: string; value: string } | null> | null;
			} | null> | null;
		} | null> | null;
	};
};

export type ClusterRecordsTitleOnlyQueryVariables = Exact<{
	query: string;
}>;

export type ClusterRecordsTitleOnlyQuery = {
	instanceClusters: {
		content: Array<{
			id: string;
			title: string | null;
			selectedBib: string | null;
			isDeleted: boolean | null;
			dateCreated: string | null;
			dateUpdated: string | null;
		} | null> | null;
	};
};

export type LoadConsortiumQueryVariables = Exact<{
	order: string;
	orderBy: string;
}>;

export type LoadConsortiumQuery = {
	consortia: {
		totalSize: number | null;
		content: Array<{
			id: string;
			name: string;
			dateOfLaunch: string | null;
			headerImageUrl: string | null;
			headerImageUploader: string | null;
			headerImageUploaderEmail: string | null;
			aboutImageUrl: string | null;
			aboutImageUploader: string | null;
			aboutImageUploaderEmail: string | null;
			description: string | null;
			catalogueSearchUrl: string | null;
			websiteUrl: string | null;
			displayName: string | null;
			libraryGroup: { id: string };
			contacts: Array<{
				email: string | null;
				id: string | null;
			} | null> | null;
			functionalSettings: Array<{
				id: string;
				name: FunctionalSettingType;
				enabled: boolean;
			} | null> | null;
		} | null> | null;
	};
};

export type LoadConsortiumHeaderQueryVariables = Exact<{
	order: string;
	orderBy: string;
}>;

export type LoadConsortiumHeaderQuery = {
	consortia: {
		totalSize: number | null;
		content: Array<{
			id: string;
			name: string;
			displayName: string | null;
			headerImageUrl: string | null;
			aboutImageUrl: string | null;
			description: string | null;
			catalogueSearchUrl: string | null;
			websiteUrl: string | null;
		} | null> | null;
	};
};

export type LoadConsortiumContactsQueryVariables = Exact<{
	order: string;
	orderBy: string;
}>;

export type LoadConsortiumContactsQuery = {
	consortia: {
		totalSize: number | null;
		content: Array<{
			id: string;
			name: string;
			displayName: string | null;
			contacts: Array<{
				id: string | null;
				firstName: string | null;
				lastName: string | null;
				isPrimaryContact: boolean | null;
				email: string | null;
				role: {
					id: string;
					name: string;
					description: string | null;
					displayName: string;
					keycloakRole: string | null;
				};
			} | null> | null;
		} | null> | null;
	};
};

export type LoadConsortiumFsQueryVariables = Exact<{
	order: string;
	orderBy: string;
}>;

export type LoadConsortiumFsQuery = {
	consortia: {
		totalSize: number | null;
		content: Array<{
			id: string;
			name: string;
			displayName: string | null;
			functionalSettings: Array<{
				id: string;
				name: FunctionalSettingType;
				enabled: boolean;
				description: string | null;
			} | null> | null;
		} | null> | null;
	};
};

export type LoadDataChangeLogQueryVariables = Exact<{
	pageno: number;
	pagesize: number;
	order: string;
	query: string;
	orderBy: string;
}>;

export type LoadDataChangeLogQuery = {
	dataChangeLog: {
		totalSize: number | null;
		content: Array<{
			id: string;
			entityId: string;
			entityType: string;
			actionInfo: string;
			lastEditedBy: string | null;
			timestampLogged: string;
			reason: string | null;
			changeReferenceUrl: string | null;
			changeCategory: string | null;
			changes: Record<string, any>;
		} | null> | null;
		pageable: { number: number | null; offset: number | null } | null;
	};
};

export type GetDataChangeLogByIdQueryVariables = Exact<{
	query: string;
}>;

export type GetDataChangeLogByIdQuery = {
	dataChangeLog: {
		totalSize: number | null;
		content: Array<{
			id: string;
			entityId: string;
			entityType: string;
			actionInfo: string;
			lastEditedBy: string | null;
			timestampLogged: string;
			reason: string | null;
			changeReferenceUrl: string | null;
			changeCategory: string | null;
			changes: Record<string, any>;
		} | null> | null;
		pageable: { number: number | null; offset: number | null } | null;
	};
};

export type LoadGroupQueryVariables = Exact<{
	query: string;
}>;

export type LoadGroupQuery = {
	libraryGroups: {
		content: Array<{
			id: string;
			code: string;
			name: string;
			type: string;
			consortium: { id: string; name: string } | null;
			members: Array<{
				id: string;
				library: {
					id: string;
					agencyCode: string | null;
					shortName: string | null;
					fullName: string | null;
					abbreviatedName: string | null;
					longitude: number | null;
					latitude: number | null;
					agency: {
						authProfile: string | null;
						code: string | null;
						id: string | null;
						isBorrowingAgency: boolean | null;
						isSupplyingAgency: boolean | null;
						hostLms: {
							lmsClientClass: string | null;
							code: string | null;
							id: string | null;
						} | null;
					} | null;
				} | null;
			} | null> | null;
		} | null> | null;
	};
};

export type LoadGroupsSelectionQueryVariables = Exact<{
	order: string;
	orderBy: string;
	pageno?: number | null | undefined;
	pagesize?: number | null | undefined;
}>;

export type LoadGroupsSelectionQuery = {
	libraryGroups: {
		totalSize: number | null;
		content: Array<{
			id: string;
			code: string;
			name: string;
			type: string;
		} | null> | null;
	};
};

export type LoadHostLmsQueryVariables = Exact<{
	query: string;
	pageno?: number | null | undefined;
	pagesize?: number | null | undefined;
	order?: string | null | undefined;
	orderBy?: string | null | undefined;
}>;

export type LoadHostLmsQuery = {
	hostLms: {
		totalSize: number | null;
		content: Array<{
			id: string | null;
			code: string | null;
			name: string | null;
			lmsClientClass: string | null;
			clientConfig: Record<string, any> | null;
			itemSuppressionRulesetName: string | null;
			suppressionRulesetName: string | null;
		} | null> | null;
	};
};

export type LoadHostLmsCodesQueryVariables = Exact<{
	query: string;
	pagesize: number;
}>;

export type LoadHostLmsCodesQuery = {
	hostLms: {
		content: Array<{ id: string | null; code: string | null } | null> | null;
	};
};

export type LoadLibrariesQueryVariables = Exact<{
	pageno: number;
	pagesize: number;
	order: string;
	query: string;
	orderBy: string;
}>;

export type LoadLibrariesQuery = {
	libraries: {
		totalSize: number | null;
		content: Array<{
			id: string;
			fullName: string | null;
			shortName: string | null;
			abbreviatedName: string | null;
			agencyCode: string | null;
			supportHours: string | null;
			address: string | null;
			type: string | null;
			agency: {
				id: string | null;
				code: string | null;
				name: string | null;
				authProfile: string | null;
				isSupplyingAgency: boolean | null;
				isBorrowingAgency: boolean | null;
				hostLms: {
					id: string | null;
					code: string | null;
					clientConfig: Record<string, any> | null;
					lmsClientClass: string | null;
				} | null;
			} | null;
			secondHostLms: {
				id: string | null;
				code: string | null;
				clientConfig: Record<string, any> | null;
				lmsClientClass: string | null;
			} | null;
			membership: Array<{
				libraryGroup: {
					id: string;
					code: string;
					name: string;
					type: string;
					consortium: {
						id: string;
						name: string;
						dateOfLaunch: string | null;
						functionalSettings: Array<{
							id: string;
							name: FunctionalSettingType;
							enabled: boolean;
						} | null> | null;
					} | null;
				} | null;
			} | null> | null;
		} | null> | null;
		pageable: { number: number | null; offset: number | null } | null;
	};
};

export type LoadLibraryQueryVariables = Exact<{
	query: string;
}>;

export type LoadLibraryQuery = {
	libraries: {
		content: Array<{
			id: string;
			fullName: string | null;
			shortName: string | null;
			abbreviatedName: string | null;
			agencyCode: string | null;
			supportHours: string | null;
			address: string | null;
			latitude: number | null;
			longitude: number | null;
			training: boolean | null;
			patronWebsite: string | null;
			discoverySystem: string | null;
			type: string | null;
			backupDowntimeSchedule: string | null;
			hostLmsConfiguration: string | null;
			principalLabel: string | null;
			secretLabel: string | null;
			agency: {
				id: string | null;
				code: string | null;
				name: string | null;
				authProfile: string | null;
				isSupplyingAgency: boolean | null;
				isBorrowingAgency: boolean | null;
				hostLms: {
					id: string | null;
					code: string | null;
					name: string | null;
					clientConfig: Record<string, any> | null;
					lmsClientClass: string | null;
					itemSuppressionRulesetName: string | null;
					suppressionRulesetName: string | null;
				} | null;
			} | null;
			secondHostLms: {
				id: string | null;
				code: string | null;
				name: string | null;
				clientConfig: Record<string, any> | null;
				lmsClientClass: string | null;
				itemSuppressionRulesetName: string | null;
				suppressionRulesetName: string | null;
			} | null;
			membership: Array<{
				libraryGroup: {
					id: string;
					code: string;
					name: string;
					type: string;
					consortium: {
						id: string;
						name: string;
						functionalSettings: Array<{
							id: string;
							name: FunctionalSettingType;
							enabled: boolean;
						} | null> | null;
					} | null;
				} | null;
			} | null> | null;
			contacts: Array<{
				id: string | null;
				firstName: string | null;
				lastName: string | null;
				isPrimaryContact: boolean | null;
				email: string | null;
				role: {
					id: string;
					name: string;
					description: string | null;
					displayName: string;
					keycloakRole: string | null;
				};
			} | null> | null;
		} | null> | null;
	};
};

export type LoadLibraryBasicsQueryVariables = Exact<{
	query: string;
}>;

export type LoadLibraryBasicsQuery = {
	libraries: {
		content: Array<{
			id: string;
			fullName: string | null;
			shortName: string | null;
			agencyCode: string | null;
			contacts: Array<{
				id: string | null;
				firstName: string | null;
				lastName: string | null;
				isPrimaryContact: boolean | null;
				email: string | null;
				role: {
					id: string;
					name: string;
					description: string | null;
					displayName: string;
					keycloakRole: string | null;
				};
			} | null> | null;
			agency: {
				id: string | null;
				code: string | null;
				maxConsortialLoans: number | null;
				isSupplyingAgency: boolean | null;
				isBorrowingAgency: boolean | null;
				hostLms: {
					id: string | null;
					code: string | null;
					lmsClientClass: string | null;
				} | null;
			} | null;
			secondHostLms: {
				code: string | null;
				name: string | null;
				id: string | null;
				lmsClientClass: string | null;
			} | null;
		} | null> | null;
	};
};

export type LoadLibraryBasicsLocationQueryVariables = Exact<{
	query: string;
}>;

export type LoadLibraryBasicsLocationQuery = {
	libraries: {
		content: Array<{
			id: string;
			fullName: string | null;
			shortName: string | null;
			agencyCode: string | null;
			contacts: Array<{
				id: string | null;
				firstName: string | null;
				lastName: string | null;
				isPrimaryContact: boolean | null;
				email: string | null;
				role: {
					id: string;
					name: string;
					description: string | null;
					displayName: string;
					keycloakRole: string | null;
				};
			} | null> | null;
			agency: {
				id: string | null;
				code: string | null;
				maxConsortialLoans: number | null;
				hostLms: {
					id: string | null;
					code: string | null;
					lmsClientClass: string | null;
				} | null;
			} | null;
			secondHostLms: {
				id: string | null;
				code: string | null;
				name: string | null;
				lmsClientClass: string | null;
			} | null;
		} | null> | null;
	};
};

export type LoadLibraryBasicsPrQueryVariables = Exact<{
	query: string;
}>;

export type LoadLibraryBasicsPrQuery = {
	libraries: {
		content: Array<{
			id: string;
			fullName: string | null;
			agencyCode: string | null;
			agency: {
				id: string | null;
				authProfile: string | null;
				hostLms: {
					id: string | null;
					code: string | null;
					name: string | null;
				} | null;
			} | null;
		} | null> | null;
	};
};

export type LoadLibraryBibClusterIdsQueryVariables = Exact<{
	query: string;
	pagesize?: number | null | undefined;
	pageno?: number | null | undefined;
}>;

export type LoadLibraryBibClusterIdsQuery = {
	patronRequests: {
		content: Array<{
			bibClusterId: string | null;
			clusterRecord: {
				title: string | null;
				members: Array<{ publisher: string | null } | null> | null;
			} | null;
		} | null> | null;
	} | null;
};

export type LoadLibraryContactsQueryVariables = Exact<{
	pageno: number;
	pagesize: number;
	order: string;
	query: string;
	orderBy: string;
}>;

export type LoadLibraryContactsQuery = {
	libraries: {
		content: Array<{
			id: string;
			fullName: string | null;
			shortName: string | null;
			contacts: Array<{
				id: string | null;
				firstName: string | null;
				lastName: string | null;
				isPrimaryContact: boolean | null;
				email: string | null;
				role: {
					id: string;
					name: string;
					description: string | null;
					displayName: string;
					keycloakRole: string | null;
				};
			} | null> | null;
		} | null> | null;
	};
};

export type LoadGroupsQueryVariables = Exact<{
	pageno: number;
	pagesize: number;
	order: string;
	query: string;
	orderBy: string;
}>;

export type LoadGroupsQuery = {
	libraryGroups: {
		totalSize: number | null;
		content: Array<{
			id: string;
			code: string;
			name: string;
			type: string;
			consortium: { name: string; id: string } | null;
		} | null> | null;
		pageable: { number: number | null; offset: number | null } | null;
	};
};

export type LoadLibraryServiceInfoQueryVariables = Exact<{
	query: string;
}>;

export type LoadLibraryServiceInfoQuery = {
	libraries: {
		content: Array<{
			id: string;
			fullName: string | null;
			patronWebsite: string | null;
			discoverySystem: string | null;
			backupDowntimeSchedule: string | null;
			hostLmsConfiguration: string | null;
			agency: {
				id: string | null;
				authProfile: string | null;
				hostLms: {
					id: string | null;
					code: string | null;
					name: string | null;
					clientConfig: Record<string, any> | null;
					lmsClientClass: string | null;
					itemSuppressionRulesetName: string | null;
					suppressionRulesetName: string | null;
				} | null;
			} | null;
			secondHostLms: {
				id: string | null;
				code: string | null;
				name: string | null;
				clientConfig: Record<string, any> | null;
				lmsClientClass: string | null;
				itemSuppressionRulesetName: string | null;
				suppressionRulesetName: string | null;
			} | null;
		} | null> | null;
	};
};

export type LoadLocationQueryVariables = Exact<{
	query: string;
}>;

export type LoadLocationQuery = {
	locations: {
		content: Array<{
			id: string;
			code: string | null;
			name: string | null;
			type: string | null;
			isPickup: boolean | null;
			isEnabledForPickupAnywhere: boolean | null;
			localId: string | null;
			longitude: number | null;
			latitude: number | null;
			printLabel: string | null;
			deliveryStops: string | null;
			locationReference: string | null;
			dateCreated: string | null;
			dateUpdated: string | null;
			agency: {
				id: string | null;
				code: string | null;
				name: string | null;
				authProfile: string | null;
				longitude: number | null;
				latitude: number | null;
			} | null;
			parentLocation: {
				id: string;
				code: string | null;
				name: string | null;
				type: string | null;
				isPickup: boolean | null;
				isEnabledForPickupAnywhere: boolean | null;
				longitude: number | null;
				latitude: number | null;
				dateCreated: string | null;
				dateUpdated: string | null;
				hostSystem: {
					id: string | null;
					code: string | null;
					name: string | null;
					lmsClientClass: string | null;
					clientConfig: Record<string, any> | null;
				} | null;
			} | null;
			hostSystem: {
				id: string | null;
				code: string | null;
				name: string | null;
				lmsClientClass: string | null;
				clientConfig: Record<string, any> | null;
			} | null;
		} | null> | null;
	};
};

export type LoadLocationForPrGridQueryVariables = Exact<{
	pageno: number;
	pagesize: number;
	order: string;
	query: string;
	orderBy: string;
}>;

export type LoadLocationForPrGridQuery = {
	locations: {
		totalSize: number | null;
		content: Array<{
			id: string;
			code: string | null;
			name: string | null;
		} | null> | null;
		pageable: { number: number | null; offset: number | null } | null;
	};
};

export type LoadLocationsQueryVariables = Exact<{
	pageno: number;
	pagesize: number;
	order: string;
	query: string;
	orderBy: string;
}>;

export type LoadLocationsQuery = {
	locations: {
		totalSize: number | null;
		content: Array<{
			id: string;
			code: string | null;
			name: string | null;
			type: string | null;
			isPickup: boolean | null;
			isEnabledForPickupAnywhere: boolean | null;
			printLabel: string | null;
			localId: string | null;
			deliveryStops: string | null;
			lastImported: string | null;
			latitude: number | null;
			longitude: number | null;
			agency: {
				id: string | null;
				name: string | null;
				code: string | null;
			} | null;
			hostSystem: { name: string | null } | null;
		} | null> | null;
		pageable: { number: number | null; offset: number | null } | null;
	};
};

export type LoadMappingsQueryVariables = Exact<{
	pageno: number;
	pagesize: number;
	order: string;
	query: string;
	orderBy: string;
}>;

export type LoadMappingsQuery = {
	referenceValueMappings: {
		totalSize: number | null;
		content: Array<{
			id: string;
			fromCategory: string | null;
			fromContext: string | null;
			fromValue: string | null;
			toCategory: string | null;
			toContext: string | null;
			toValue: string | null;
			reciprocal: boolean | null;
			label: string | null;
			lastImported: string | null;
			deleted: boolean | null;
		} | null> | null;
		pageable: { number: number | null; offset: number | null } | null;
	};
};

export type LoadNumericRangeMappingsQueryVariables = Exact<{
	pageno: number;
	pagesize: number;
	order: string;
	orderBy: string;
	query: string;
}>;

export type LoadNumericRangeMappingsQuery = {
	numericRangeMappings: {
		totalSize: number | null;
		content: Array<{
			id: string;
			context: string | null;
			domain: string | null;
			lowerBound: number | null;
			upperBound: number | null;
			targetContext: string | null;
			mappedValue: string | null;
			lastImported: string | null;
			deleted: boolean | null;
		} | null> | null;
		pageable: { number: number | null; offset: number | null } | null;
	};
};

export type LoadPatronIdentitiesQueryVariables = Exact<{
	query: string;
	order: string;
	orderBy: string;
}>;

export type LoadPatronIdentitiesQuery = {
	patronIdentities: {
		totalSize: number | null;
		content: Array<{
			id: string;
			localId: string | null;
			homeIdentity: boolean | null;
			localBarcode: string | null;
			localNames: string | null;
			localPtype: string | null;
			canonicalPtype: string | null;
			localHomeLibraryCode: string | null;
			lastValidated: string | null;
		} | null> | null;
	};
};

export type LoadPatronRequestQueryVariables = Exact<{
	query: string;
}>;

export type LoadPatronRequestQuery = {
	patronRequests: {
		content: Array<{
			id: string;
			dateUpdated: string | null;
			patronHostlmsCode: string | null;
			bibClusterId: string | null;
			pickupLocationCode: string | null;
			pickupPatronId: string | null;
			pickupItemId: string | null;
			pickupItemType: string | null;
			pickupItemStatus: string | null;
			pickupRequestId: string | null;
			pickupRequestStatus: string | null;
			pickupBibId: string | null;
			rawPickupItemStatus: string | null;
			rawPickupRequestStatus: string | null;
			status: string | null;
			localRequestId: string | null;
			localRequestStatus: string | null;
			localItemId: string | null;
			localItemStatus: string | null;
			localItemType: string | null;
			isExpeditedCheckout: boolean | null;
			localBibId: string | null;
			rawLocalItemStatus: string | null;
			rawLocalRequestStatus: string | null;
			description: string | null;
			nextScheduledPoll: string | null;
			errorMessage: string | null;
			previousStatus: string | null;
			pollCountForCurrentStatus: number | null;
			currentStatusTimestamp: string | null;
			nextExpectedStatus: string | null;
			outOfSequenceFlag: boolean | null;
			elapsedTimeInCurrentStatus: number | null;
			localItemHostlmsCode: string | null;
			localItemAgencyCode: string | null;
			isManuallySelectedItem: boolean | null;
			resolutionCount: number | null;
			renewalCount: number | null;
			renewalStatus: RenewalStatus | null;
			localRenewalCount: number | null;
			dateCreated: string | null;
			activeWorkflow: string | null;
			requesterNote: string | null;
			patron: { id: string } | null;
			requestingIdentity: {
				id: string;
				localId: string | null;
				homeIdentity: boolean | null;
				localBarcode: string | null;
				localNames: string | null;
				localPtype: string | null;
				canonicalPtype: string | null;
				localHomeLibraryCode: string | null;
				lastValidated: string | null;
			} | null;
			audit: Array<{
				id: string;
				auditDate: string | null;
				briefDescription: string | null;
				fromStatus: string | null;
				toStatus: string | null;
				auditData: Record<string, any> | null;
			} | null> | null;
			clusterRecord: {
				id: string;
				title: string | null;
				selectedBib: string | null;
				isDeleted: boolean | null;
				dateCreated: string | null;
				dateUpdated: string | null;
				members: Array<{
					id: string;
					dateCreated: string | null;
					dateUpdated: string | null;
					title: string | null;
					author: string | null;
					placeOfPublication: string | null;
					publisher: string | null;
					dateOfPublication: string | null;
					edition: string | null;
					isLargePrint: boolean | null;
					clusterReason: string | null;
					typeOfRecord: string | null;
					canonicalMetadata: Record<string, any> | null;
					metadataScore: number | null;
					processVersion: number | null;
					sourceSystemId: string | null;
					sourceRecordId: string | null;
					sourceRecord: {
						id: string;
						hostLmsId: string;
						remoteId: string;
						lastFetched: string;
						lastProcessed: string | null;
						processingState: ProcessingStatus | null;
						processingInformation: string | null;
						sourceRecordData: Record<string, any> | null;
					} | null;
				} | null> | null;
			} | null;
			suppliers: Array<{
				id: string;
				canonicalItemType: string | null;
				dateCreated: string | null;
				dateUpdated: string | null;
				hostLmsCode: string | null;
				isActive: boolean | null;
				localItemId: string | null;
				localBibId: string | null;
				localItemBarcode: string | null;
				localItemLocationCode: string | null;
				localItemStatus: string | null;
				localItemType: string | null;
				localId: string | null;
				localRenewalCount: number | null;
				localStatus: string | null;
				localAgency: string | null;
				rawLocalItemStatus: string | null;
				rawLocalStatus: string | null;
				virtualPatron: {
					id: string;
					localId: string | null;
					homeIdentity: boolean | null;
					localBarcode: string | null;
					localNames: string | null;
					localPtype: string | null;
					canonicalPtype: string | null;
					localHomeLibraryCode: string | null;
					lastValidated: string | null;
				} | null;
			} | null> | null;
		} | null> | null;
	} | null;
};

export type GetPatronRequestDashboardQueryVariables = Exact<{
	allQuery?: string | null | undefined;
	activeQuery?: string | null | undefined;
	exceptionQuery?: string | null | undefined;
	outOfSequenceQuery?: string | null | undefined;
	finishedQuery?: string | null | undefined;
	pageno?: number | null | undefined;
	pagesize?: number | null | undefined;
	order?: string | null | undefined;
	orderBy?: string | null | undefined;
}>;

export type GetPatronRequestDashboardQuery = {
	allRequests: {
		totalSize: number | null;
		content: Array<{
			id: string;
			dateCreated: string | null;
			dateUpdated: string | null;
			patronHostlmsCode: string | null;
			pickupLocationCode: string | null;
			description: string | null;
			status: string | null;
			previousStatus: string | null;
			nextExpectedStatus: string | null;
			errorMessage: string | null;
			outOfSequenceFlag: boolean | null;
			elapsedTimeInCurrentStatus: number | null;
			pollCountForCurrentStatus: number | null;
			renewalCount: number | null;
			resolutionCount: number | null;
			isManuallySelectedItem: boolean | null;
			requesterNote: string | null;
			activeWorkflow: string | null;
			pickupRequestId: string | null;
			pickupRequestStatus: string | null;
			pickupItemId: string | null;
			isExpeditedCheckout: boolean | null;
			rawLocalRequestStatus: string | null;
			rawLocalItemStatus: string | null;
			localRequestId: string | null;
			localRequestStatus: string | null;
			localItemId: string | null;
			localItemStatus: string | null;
			localItemType: string | null;
			patron: { id: string } | null;
			requestingIdentity: {
				id: string;
				localId: string | null;
				localBarcode: string | null;
				canonicalPtype: string | null;
			} | null;
			suppliers: Array<{
				id: string;
				canonicalItemType: string | null;
				dateCreated: string | null;
				dateUpdated: string | null;
				hostLmsCode: string | null;
				isActive: boolean | null;
				localItemId: string | null;
				localBibId: string | null;
				localItemBarcode: string | null;
				localItemLocationCode: string | null;
				localItemStatus: string | null;
				localItemType: string | null;
				localId: string | null;
				localRenewalCount: number | null;
				localStatus: string | null;
				localAgency: string | null;
				rawLocalItemStatus: string | null;
				rawLocalStatus: string | null;
			} | null> | null;
			clusterRecord: {
				id: string;
				title: string | null;
				members: Array<{ publisher: string | null } | null> | null;
			} | null;
		} | null> | null;
	} | null;
	activeRequests: { totalSize: number | null } | null;
	exceptionRequests: { totalSize: number | null } | null;
	outOfSequenceRequests: { totalSize: number | null } | null;
	finishedRequests: { totalSize: number | null } | null;
};

export type LoadPatronRequestsByIdQueryVariables = Exact<{
	query: string;
}>;

export type LoadPatronRequestsByIdQuery = {
	patronRequests: {
		content: Array<{
			id: string;
			dateUpdated: string | null;
			patronHostlmsCode: string | null;
			bibClusterId: string | null;
			status: string | null;
			localRequestId: string | null;
			localRequestStatus: string | null;
			localItemId: string | null;
			localItemStatus: string | null;
			localItemType: string | null;
			localBibId: string | null;
			rawLocalItemStatus: string | null;
			rawLocalRequestStatus: string | null;
			description: string | null;
			nextScheduledPoll: string | null;
			errorMessage: string | null;
			previousStatus: string | null;
			pollCountForCurrentStatus: number | null;
			currentStatusTimestamp: string | null;
			nextExpectedStatus: string | null;
			outOfSequenceFlag: boolean | null;
			elapsedTimeInCurrentStatus: number | null;
			localItemHostlmsCode: string | null;
			localItemAgencyCode: string | null;
			isManuallySelectedItem: boolean | null;
			resolutionCount: number | null;
			renewalCount: number | null;
			renewalStatus: RenewalStatus | null;
			localRenewalCount: number | null;
			dateCreated: string | null;
			activeWorkflow: string | null;
			requesterNote: string | null;
		} | null> | null;
	} | null;
};

export type LoadPatronRequestStatsQueryVariables = Exact<{
	pageno: number;
	pagesize: number;
	order: string;
	query: string;
	orderBy: string;
}>;

export type LoadPatronRequestStatsQuery = {
	patronRequests: {
		totalSize: number | null;
		content: Array<{
			id: string;
			dateCreated: string | null;
			dateUpdated: string | null;
			patronHostlmsCode: string | null;
			suppliers: Array<{
				localAgency: string | null;
				canonicalItemType: string | null;
			} | null> | null;
		} | null> | null;
		pageable: { number: number | null; offset: number | null } | null;
	} | null;
};

export type LoadPatronRequestTotalsQueryVariables = Exact<{
	pageno: number;
	pagesize: number;
	order: string;
	query: string;
	orderBy: string;
}>;

export type LoadPatronRequestTotalsQuery = {
	patronRequests: {
		totalSize: number | null;
		content: Array<{
			id: string;
			dateCreated: string | null;
			dateUpdated: string | null;
			status: string | null;
			patronHostlmsCode: string | null;
			isExpeditedCheckout: boolean | null;
			outOfSequenceFlag: boolean | null;
		} | null> | null;
		pageable: { number: number | null; offset: number | null } | null;
	} | null;
};

export type LoadPatronRequestsQueryVariables = Exact<{
	pageno: number;
	pagesize: number;
	order: string;
	query: string;
	orderBy: string;
}>;

export type LoadPatronRequestsQuery = {
	patronRequests: {
		totalSize: number | null;
		content: Array<{
			id: string;
			dateCreated: string | null;
			dateUpdated: string | null;
			patronHostlmsCode: string | null;
			pickupLocationCode: string | null;
			description: string | null;
			status: string | null;
			previousStatus: string | null;
			nextExpectedStatus: string | null;
			errorMessage: string | null;
			outOfSequenceFlag: boolean | null;
			elapsedTimeInCurrentStatus: number | null;
			pollCountForCurrentStatus: number | null;
			renewalCount: number | null;
			resolutionCount: number | null;
			isManuallySelectedItem: boolean | null;
			requesterNote: string | null;
			activeWorkflow: string | null;
			pickupRequestId: string | null;
			pickupRequestStatus: string | null;
			pickupItemId: string | null;
			isExpeditedCheckout: boolean | null;
			rawLocalRequestStatus: string | null;
			rawLocalItemStatus: string | null;
			localRequestId: string | null;
			localRequestStatus: string | null;
			localItemId: string | null;
			localItemStatus: string | null;
			localItemType: string | null;
			patron: { id: string } | null;
			requestingIdentity: {
				id: string;
				localId: string | null;
				localBarcode: string | null;
				canonicalPtype: string | null;
			} | null;
			suppliers: Array<{
				id: string;
				canonicalItemType: string | null;
				dateCreated: string | null;
				dateUpdated: string | null;
				hostLmsCode: string | null;
				isActive: boolean | null;
				localItemId: string | null;
				localBibId: string | null;
				localItemBarcode: string | null;
				localItemLocationCode: string | null;
				localItemStatus: string | null;
				localItemType: string | null;
				localId: string | null;
				localRenewalCount: number | null;
				localStatus: string | null;
				localAgency: string | null;
				rawLocalItemStatus: string | null;
				rawLocalStatus: string | null;
			} | null> | null;
			clusterRecord: {
				id: string;
				title: string | null;
				members: Array<{ publisher: string | null } | null> | null;
			} | null;
		} | null> | null;
		pageable: { number: number | null; offset: number | null } | null;
	} | null;
};

export type LoadPatronRequestsForExportQueryVariables = Exact<{
	pageno: number;
	pagesize: number;
	order: string;
	query: string;
	orderBy: string;
}>;

export type LoadPatronRequestsForExportQuery = {
	patronRequests: {
		totalSize: number | null;
		content: Array<{
			id: string;
			dateCreated: string | null;
			dateUpdated: string | null;
			patronHostlmsCode: string | null;
			pickupLocationCode: string | null;
			description: string | null;
			status: string | null;
			previousStatus: string | null;
			nextExpectedStatus: string | null;
			errorMessage: string | null;
			outOfSequenceFlag: boolean | null;
			elapsedTimeInCurrentStatus: number | null;
			pollCountForCurrentStatus: number | null;
			renewalCount: number | null;
			resolutionCount: number | null;
			isManuallySelectedItem: boolean | null;
			requesterNote: string | null;
			activeWorkflow: string | null;
			pickupRequestId: string | null;
			pickupRequestStatus: string | null;
			pickupItemId: string | null;
			isExpeditedCheckout: boolean | null;
			rawLocalRequestStatus: string | null;
			rawLocalItemStatus: string | null;
			localRequestId: string | null;
			localRequestStatus: string | null;
			localItemId: string | null;
			localItemStatus: string | null;
			localItemType: string | null;
			patron: { id: string } | null;
			requestingIdentity: {
				id: string;
				localId: string | null;
				localBarcode: string | null;
				canonicalPtype: string | null;
			} | null;
			suppliers: Array<{
				id: string;
				canonicalItemType: string | null;
				dateCreated: string | null;
				dateUpdated: string | null;
				hostLmsCode: string | null;
				isActive: boolean | null;
				localItemId: string | null;
				localBibId: string | null;
				localItemBarcode: string | null;
				localItemLocationCode: string | null;
				localItemStatus: string | null;
				localItemType: string | null;
				localId: string | null;
				localRenewalCount: number | null;
				localStatus: string | null;
				localAgency: string | null;
				rawLocalItemStatus: string | null;
				rawLocalStatus: string | null;
			} | null> | null;
			clusterRecord: {
				id: string;
				title: string | null;
				members: Array<{ publisher: string | null } | null> | null;
			} | null;
		} | null> | null;
		pageable: { number: number | null; offset: number | null } | null;
	} | null;
};

export type LoadRolesQueryVariables = Exact<{
	order: string;
	orderBy: string;
	pagesize: number;
}>;

export type LoadRolesQuery = {
	roles: {
		totalSize: number | null;
		content: Array<{
			id: string;
			name: string;
			keycloakRole: string | null;
			description: string | null;
			displayName: string;
		} | null> | null;
	};
};

export type LoadSupplierRequestsQueryVariables = Exact<{
	pageno: number;
	pagesize: number;
	order: string;
	query: string;
	orderBy: string;
}>;

export type LoadSupplierRequestsQuery = {
	supplierRequests: {
		totalSize: number | null;
		content: Array<{
			id: string;
			canonicalItemType: string | null;
			dateCreated: string | null;
			dateUpdated: string | null;
			hostLmsCode: string | null;
			isActive: boolean | null;
			localItemId: string | null;
			localBibId: string | null;
			localItemBarcode: string | null;
			localItemLocationCode: string | null;
			localItemStatus: string | null;
			localItemType: string | null;
			localId: string | null;
			localStatus: string | null;
			localAgency: string | null;
			rawLocalItemStatus: string | null;
			rawLocalStatus: string | null;
			localRenewalCount: number | null;
			virtualPatron: {
				id: string;
				localId: string | null;
				homeIdentity: boolean | null;
				localBarcode: string | null;
				localNames: string | null;
				localPtype: string | null;
				canonicalPtype: string | null;
				localHomeLibraryCode: string | null;
				lastValidated: string | null;
			} | null;
			patronRequest: { id: string } | null;
		} | null> | null;
		pageable: { number: number | null; offset: number | null } | null;
	};
};
