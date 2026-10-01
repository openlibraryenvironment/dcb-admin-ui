// Filter-query shaping for the data grids. The grid-type lists that used to sit
// here were a second, drifted copy of src/constants/dataGrid/types.ts, read only
// by a dead resolver; quickFieldMap lives in src/constants/dataGrid/fields.ts.

// The fields where we need to apply conversion before sending a query.
// For example, the filter input for "elapsed time in current status" is in days.
// But it is stored on the server in seconds.
export const conversionFields = ["elapsedTimeInCurrentStatus"];
// Conversion field and conversion factor
export const conversionFieldsMap: Record<string, number> = {
	elapsedTimeInCurrentStatus: 86400,
};

export const numericOperators = [">=", ">", "<=", "<", "=", "!="];
