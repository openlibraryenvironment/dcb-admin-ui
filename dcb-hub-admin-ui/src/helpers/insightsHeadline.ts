import type { NetFlowStat } from "@helpers/statsApi";

/**
 * How many members did anything in the window.
 *
 * The network-health number a consortium director asks for, and the only headline figure
 * that has to be derived rather than read. /insights/net-flow returns one row per Host LMS
 * code with what it borrowed and what it supplied, which is exactly "did this member take
 * part", so it needs no endpoint of its own.
 *
 * IT COUNTS HOST LMS SYSTEMS, NOT LIBRARIES. Several libraries can sit on one Host LMS -
 * which is why the partner queries resolve a partner name with string_agg rather than
 * picking one. Where every member has its own system the two agree; where a shared system
 * serves several, this is the count of systems that were active. The tile says so.
 */
export function activeSystems(rows: NetFlowStat[] | undefined): number {
	return (rows ?? []).filter((row) => row.borrowedCount + row.suppliedCount > 0)
		.length;
}
