export interface AppliedTag {
	code: string;
	label: string;
	consortium: boolean;
	agencyCodes: string[];
}

// Structural, so the grid rows' model and the request page's query result both fit it
type TagSelection = ReadonlyArray<{
	code?: string | null;
	label?: string | null;
	agencyCodes?: ReadonlyArray<string | null> | null;
	consortium?: boolean | null;
} | null> | null;

/** The tags on a request as dcb-service returns them, without the nulls its schema allows. */
export const appliedTags = (tags: TagSelection | undefined): AppliedTag[] =>
	(tags ?? []).flatMap((tag) =>
		tag?.code
			? [
					{
						code: tag.code,
						label: tag.label ?? tag.code,
						consortium: tag.consortium === true,
						agencyCodes: (tag.agencyCodes ?? []).flatMap((code) =>
							code ? [code] : [],
						),
					},
				]
			: [],
	);

/** Where the request page's tags section starts, so "Manage tags" can take focus there. */
export const REQUEST_TAGS_SECTION_ID = "request-tags";
