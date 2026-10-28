import { Box, Chip } from "@mui/material";

import { tagColour } from "@helpers/tagColour";

export interface ShownTag {
	code: string;
	label: string;
	/** The tag's stored colour, where dcb-service has one. */
	colour?: string | null;
}

/** One request tag, the same wherever it appears: the page, the row detail and the grid. */
export function TagChip({ tag }: { tag: ShownTag }) {
	return (
		<Chip
			size="small"
			label={tag.label}
			color={tagColour(tag.code, tag.colour)}
			// A long label wraps rather than pushing a 320px page sideways
			sx={{ height: "auto", maxWidth: "100%", py: 0.25 }}
			slotProps={{ label: { sx: { whiteSpace: "normal" } } }}
		/>
	);
}

/** A request's tags as a list, so a screen reader hears how many there are. */
export default function TagList({
	tags,
	label,
	nowrap = false,
}: {
	tags: readonly ShownTag[];
	/** The list's accessible name. */
	label: string;
	/** One line, cut off at the edge: a grid row has a fixed height. */
	nowrap?: boolean;
}) {
	return (
		<Box
			component="ul"
			aria-label={label}
			sx={{
				listStyle: "none",
				p: 0,
				m: 0,
				display: "flex",
				flexWrap: nowrap ? "nowrap" : "wrap",
				overflow: nowrap ? "hidden" : undefined,
				gap: 0.5,
			}}
		>
			{tags.map((tag) => (
				<Box
					component="li"
					key={tag.code}
					sx={{ display: "flex", maxWidth: "100%" }}
				>
					<TagChip tag={tag} />
				</Box>
			))}
		</Box>
	);
}
