export interface PatronRequest {
	requestingIdentity: any;
	id: number;
	patronId: string;
	patronAgencyCode: string;
	bibClusterId: string;
	pickupLocationCode: string;
	statusCode: string;
	suppliers: any;
	elapsedTimeInCurrentStatus: number;
}
