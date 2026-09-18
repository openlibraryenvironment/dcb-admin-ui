// Statuses where DCB will accept a manual cleanup.
//
// Cleanup deletes the borrowing library's virtual item and bib. While the physical item is out that
// orphans it - the supplier has no record to check it back in against and eventually bills for a lost
// item (DCB-2193). So every status meaning "the item is not back at the supplier yet" is excluded, and
// the API rejects them regardless of what this list says. Keep the two in step:
// see PatronRequestController.ensureValidStateForCleanupTransition.
//
// AWAITING_RETURN_TO_SUPPLIER is deliberately absent: it exists precisely to hold the records until the
// item is home, and cleaning it up by hand defeats the point.
export const cleanupStatuses = [
	"ERROR",
	"SUBMITTED_TO_DCB",
	"PATRON_VERIFIED",
	"RESOLVED",
	"REQUEST_PLACED_AT_SUPPLYING_AGENCY",
	"CONFIRMED",
	"REQUEST_PLACED_AT_BORROWING_AGENCY",
	"REQUEST_PLACED_AT_PICKUP_AGENCY",
	"NO_ITEMS_SELECTABLE_AT_ANY_AGENCY",
];
