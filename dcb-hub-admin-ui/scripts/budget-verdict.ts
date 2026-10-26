/** What the first load's size means for the build: docs/performance-budget.md, "Advisory, with one hard limit". */
export interface FirstLoadVerdict {
	/** Bytes over the budget; zero or less is within it. */
	over: number;
	/** The size above which the build fails: the budget plus `blockAbovePercent`. */
	limit: number;
	/** Over the limit, not merely over the budget. */
	blocks: boolean;
}

export function firstLoadVerdict(
	size: number,
	budget: number,
	blockAbovePercent: number,
): FirstLoadVerdict {
	const limit = Math.floor(budget * (1 + blockAbovePercent / 100));
	return { over: size - budget, limit, blocks: size > limit };
}
