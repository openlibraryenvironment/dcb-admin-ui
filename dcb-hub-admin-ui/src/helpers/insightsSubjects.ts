import { isInsightsSectionShown } from "@helpers/featureFlags";

/**
 * The six subjects, and which panels belong to each.
 *
 * The order is the reading order: what is happening, how well it went, what was asked
 * for, who with, what we hold, what we are missing. Rationale and the request cost of
 * each: INSIGHTS_IA_AND_UX_PLAN.md section 1.3.
 */

export const SUBJECTS = [
	"trends",
	"service",
	"demand",
	"partners",
	"collection",
	"gaps",
] as const;

export type Subject = (typeof SUBJECTS)[number];

export const DEFAULT_SUBJECT: Subject = "trends";

/**
 * Gaps answers "what does THIS library not hold", which needs a "this library". Across a
 * set the four queries behind it change meaning rather than narrowing, so it is hidden
 * rather than shown empty - see the plan section 7.3.
 */
export const isSubjectAvailable = (subject: Subject, scopedCodes: number) =>
	(subject !== "gaps" || scopedCodes === 1) && isInsightsSectionShown(subject);

export const visibleSubjects = (scopedCodes: number) =>
	SUBJECTS.filter((subject) => isSubjectAvailable(subject, scopedCodes));

/**
 * A subject the current scope cannot show, or the deployment does not (VITE_INSIGHTS_PANELS),
 * falls back rather than rendering nothing.
 */
export const resolveSubject = (
	requested: Subject | undefined,
	scopedCodes: number,
): Subject => {
	const visible = visibleSubjects(scopedCodes);
	if (requested && visible.includes(requested)) return requested;
	return visible.includes(DEFAULT_SUBJECT)
		? DEFAULT_SUBJECT
		: (visible[0] ?? DEFAULT_SUBJECT);
};
