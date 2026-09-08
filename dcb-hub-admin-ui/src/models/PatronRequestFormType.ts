export type RequestType = "staffRequest" | "expeditedCheckout" | "quickWalkUp";

// Cluster-based request forms (staff request, expedited checkout) always
// operate on a resolved bib cluster and are rendered inside the shared
// CombinedRequestingModal, so they no longer own their own Dialog/`show` state.
export interface PatronRequestFormType {
	onClose: () => void;
	bibClusterId: string;
}

export interface CombinedRequestingModalProps {
	show: boolean;
	onClose: () => void;
	title?: string;
	// Optional: a Quick walk-up scanned from the search results has no cluster
	// context yet, so cluster-based flows are simply unavailable in that case.
	bibClusterId?: string;
	// When set, the request-type selection screen is skipped and the chosen flow
	// opens directly (e.g. Quick walk-up launched from search results / items).
	initialRequestType?: RequestType;
	// Pre-fills the item barcode for a Quick walk-up launched from an item row.
	initialItemBarcode?: string;
}
