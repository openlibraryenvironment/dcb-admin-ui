/**
 * Where a resolved setting's value came from, and whether there is anything to undo —
 * §V-22.6.
 *
 * A rule rather than a rendering, so it can be tested as a rule. The three states are
 * genuinely three, and the one that is easiest to collapse is the one that matters most: a
 * null source is NOT "off at the consortium", it is a decision nobody has taken. An
 * administrator does different things about those two, and a display that shows them the
 * same way is the reason they cannot tell.
 */
export type SettingProvenance = "set_here" | "inherited_from" | "undecided";

export interface ResolvedSettingShape {
	source?: string | null;
	sourceName?: string | null;
	inherited?: boolean | null;
}

export const provenanceOf = (setting: ResolvedSettingShape): SettingProvenance => {
	if (!setting.source) return "undecided";

	return setting.inherited ? "inherited_from" : "set_here";
};

/**
 * Whether "revert to inherited" can do anything for this scope.
 *
 * Only where an explicit row exists at the scope being looked at. Offering it on an
 * inherited value would send a mutation that correctly reports no change, which reads as a
 * broken button; offering it on an undecided one would suggest there is something above to
 * fall back to when nothing anywhere has an opinion.
 */
export const canRevert = (setting: ResolvedSettingShape): boolean =>
	Boolean(setting.source) && !setting.inherited;
