export interface PlaceRequestResponse {
	id: string;
	citation: {
		bibClusterId: string;
	};
	pickupLocation: {
		code: string;
	};
	requestor: {
		localId: string;
		localSystemCode: string;
	};
}
