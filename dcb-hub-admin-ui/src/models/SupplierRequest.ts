import { PatronIdentity } from "./PatronIdentity";
import { PatronRequest } from "./PatronRequest";

export interface SupplierRequest {
	id: string; // ID!
	canonicalItemType?: string | null;
	dateCreated?: string | null;
	dateUpdated?: string | null;
	hostLmsCode?: string | null;
	isActive?: boolean | null;
	localItemId?: string | null;
	localBibId?: string | null;
	localItemBarcode?: string | null;
	localItemLocationCode?: string | null;
	localItemStatus?: string | null;
	localItemType?: string | null;
	localId?: string | null;
	localStatus?: string | null;
	localAgency?: string | null;
	patronRequest?: PatronRequest | null;
	virtualPatron?: PatronIdentity | null;
	rawLocalItemStatus?: string | null;
	rawLocalStatus?: string | null;
	localRenewalCount?: number | null;
	localHoldingId?: string | null;
}
