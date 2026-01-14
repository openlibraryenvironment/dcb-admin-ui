export interface PatronIdentity {
	id: string; // ID!
	localId?: string | null;
	homeIdentity?: boolean | null;
	localBarcode?: string | null;
	localNames?: string | null;
	localPtype?: string | null;
	canonicalPtype?: string | null;
	localHomeLibraryCode?: string | null;
	lastValidated?: string | null;
}
