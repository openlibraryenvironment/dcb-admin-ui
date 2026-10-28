import { useId, useState, type MouseEvent, type ReactNode } from "react";
import { IconButton, Popover, Typography } from "@mui/material";
import InfoOutlined from "@mui/icons-material/InfoOutlined";

/**
 * An info button that opens an explanation beside the thing it explains.
 *
 * CLICK, NOT HOVER. WCAG 2.2 SC 1.4.13 requires content revealed on hover to be
 * dismissable, hoverable and persistent, and paragraphs behind a tooltip meet none of
 * the three. A popover also lets a keyboard user read it without holding focus still.
 *
 * Name the trigger for what it explains rather than "info", because a screen-reader user
 * listing the buttons on a page would otherwise hear "info" twenty times.
 */
export default function HelpPopover({
	label,
	title,
	children,
}: {
	/** The button's accessible name. */
	label: string;
	/** The popover's heading, which also names it. */
	title: string;
	children: ReactNode;
}) {
	const [anchor, setAnchor] = useState<HTMLElement | null>(null);
	const id = useId();

	return (
		<>
			<IconButton
				size="small"
				aria-label={label}
				aria-haspopup="dialog"
				onClick={(event: MouseEvent<HTMLElement>) =>
					setAnchor(event.currentTarget)
				}
			>
				<InfoOutlined fontSize="inherit" />
			</IconButton>

			<Popover
				open={Boolean(anchor)}
				anchorEl={anchor}
				onClose={() => setAnchor(null)}
				anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
				slotProps={{
					paper: {
						role: "dialog",
						"aria-labelledby": id,
						// A bare maxWidth replaces MUI's calc(100% - 32px), and at 320px the paper overran the screen
						sx: { maxWidth: "min(420px, calc(100% - 32px))", p: 2 },
					},
				}}
			>
				<Typography id={id} variant="subtitle1" component="h4" gutterBottom>
					{title}
				</Typography>
				{children}
			</Popover>
		</>
	);
}
