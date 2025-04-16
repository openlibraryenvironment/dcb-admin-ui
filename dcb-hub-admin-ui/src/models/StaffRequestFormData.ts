export interface StaffRequestFormData {
	patronBarcode: string;
	agencyCode: string;
	pickupLocationId: string;
	requesterNote?: string;
	selectionType: string;
	itemLocalId?: string;
	itemLocalSystemCode?: string;
	itemAgencyCode?: string;
}
