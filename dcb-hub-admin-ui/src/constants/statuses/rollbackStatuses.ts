// Rollback is ONLY ever valid for a request in the ERROR state. Unlike cleanup
// (which spans many non-terminal statuses), this list is intentionally a single
// entry: the backend rollback restores the previous status, which only makes
// sense to recover an errored request whose failure was environmental (an
// outage), not a genuine problem with the request itself.
export const rollbackStatuses = ["ERROR"];
