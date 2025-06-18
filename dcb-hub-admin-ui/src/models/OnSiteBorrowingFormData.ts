export interface OnSiteBorrowingFormData {
	patronBarcode: string;
	agencyCode: string;
	pickupLocationId: string;
	requesterNote?: string;
	itemLocalId: string;
	itemLocalSystemCode: string;
	itemAgencyCode: string;
}
