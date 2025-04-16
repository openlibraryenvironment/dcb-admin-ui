export interface PatronLookupResponse {
	status: string; // if not VALID, cannot make request
	localPatronId: string; // this is the localId that gets sent to /place request
	agencyCode: string; // agency code
	systemCode: string; // this is localSystemCode
	homeLocationCode: string; // this is homeLibraryCode
}
