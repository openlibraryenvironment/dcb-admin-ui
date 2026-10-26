import { Children, type ReactNode } from "react";
import { Box } from "@mui/material";

import LazyPanel from "./LazyPanel";

/** Panels side by side on a wide screen; one alone takes the width, and none is nothing. */
export function PanelGrid({ children }: { children: ReactNode }) {
	const panels = Children.toArray(children);
	if (panels.length === 0) return null;
	if (panels.length === 1) return panels[0];

	return (
		<Box
			sx={{
				display: "grid",
				gap: 3,
				gridTemplateColumns: { xs: "1fr", lg: "repeat(2, 1fr)" },
			}}
		>
			{panels}
		</Box>
	);
}

/**
 * A PanelGrid mounted as it scrolls into view. Nothing at all, not even the space it
 * reserves, when the deployment shows none of its panels.
 */
export default function PanelRow({
	minHeight,
	children,
}: {
	minHeight: number;
	children: ReactNode;
}) {
	if (Children.toArray(children).length === 0) return null;

	return (
		<LazyPanel minHeight={minHeight}>
			<PanelGrid>{children}</PanelGrid>
		</LazyPanel>
	);
}
