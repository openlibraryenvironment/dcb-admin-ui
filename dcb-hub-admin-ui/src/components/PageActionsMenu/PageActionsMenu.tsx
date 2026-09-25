import React from "react";
import {
	Box,
	Button,
	CircularProgress,
	Menu,
	MenuItem,
	Stack,
	Tooltip,
	Typography,
} from "@mui/material";
import { visuallyHidden } from "@mui/utils";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { useTranslation } from "react-i18next";

export interface Action {
	key: string;
	onClick: () => void;
	disabled?: boolean;
	label: string;
	startIcon?: React.ReactNode;
	/**
	 * Optional explanation for why an item is DISABLED, shown on hover. Only
	 * rendered while the item is disabled: a disabled MUI MenuItem sets
	 * pointer-events: none, so it is wrapped in a span the tooltip can anchor to
	 * (the standard workaround for disabled controls) - but that span breaks
	 * keyboard focus, a cost only acceptable on an item that is not keyboard-
	 * reachable anyway. Enabled items stay bare MenuItems so arrow-key navigation
	 * and Enter keep working, so no tooltip is shown on them.
	 */
	tooltip?: string;
}

interface PageActionsMenuProps {
	actions: (Action | React.ReactNode)[];
	mode?: "edit" | "view";
	/**
	 * What this menu currently has in flight, translated, or null.
	 *
	 * The menu closes on click, so an item's own `disabled` state is rendered somewhere
	 * the user cannot see: the only feedback was the result alert, arriving after a round
	 * trip to a member library's LMS. This puts the wait beside the trigger they just
	 * used, and disables EVERY item while it lasts - a caller with two overlapping
	 * actions posts the second over the first (a guarded clean up begins by posting the
	 * same /update that "check for updates" does).
	 */
	pending?: string | null;
}

export default function PageActionsMenu({
	actions,
	mode = "view",
	pending = null,
}: PageActionsMenuProps) {
	const { t } = useTranslation();
	const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

	const handleClick = (event: React.MouseEvent<HTMLElement>) => {
		setAnchorEl(event.currentTarget);
	};

	const handleClose = () => {
		setAnchorEl(null);
	};

	if (mode === "edit") {
		return (
			<Stack direction="row" spacing={1}>
				{actions.map((action, index) => (
					<React.Fragment key={index}>
						{React.isValidElement(action) ? action : null}
					</React.Fragment>
				))}
			</Stack>
		);
	}

	return (
		<Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
			{/* Announced as well as shown: a spinner has no accessible name, and the
			    message is the feedback - the spinner only says it is still going. */}
			<Box aria-live="polite" aria-atomic="true" sx={visuallyHidden}>
				{pending}
			</Box>
			{pending ? (
				<Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
					<CircularProgress
						size="1rem"
						// Decoration: the text beside it carries the meaning, so it is hidden
						// from assistive technology and from anyone who asked for less motion
						// rather than being slowed to a crawl that reads as broken.
						aria-hidden="true"
						sx={{
							"@media (prefers-reduced-motion: reduce)": { display: "none" },
						}}
					/>
					<Typography variant="body2" color="text.secondary">
						{pending}
					</Typography>
				</Stack>
			) : null}
			<Button
				color="primary"
				variant="contained"
				onClick={handleClick}
				endIcon={<ArrowDropDownIcon />}
			>
				{t("ui.data_grid.actions")}
			</Button>
			<Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
				{actions.map((action, index) => {
					if (React.isValidElement(action)) {
						return (
							<MenuItem key={index} onClick={handleClose}>
								{action}
							</MenuItem>
						);
					}
					const { key, onClick, disabled, label, startIcon, tooltip } =
						action as Action;
					const menuItem = (
						<MenuItem
							key={key}
							onClick={() => {
								handleClose();
								onClick();
							}}
							disabled={disabled || Boolean(pending)}
						>
							{startIcon && <span style={{ marginRight: 8 }}>{startIcon}</span>}
							{label}
						</MenuItem>
					);
					// Only a disabled item gets the span-wrapped tooltip; an enabled
					// item stays a bare MenuItem so it remains keyboard-navigable.
					//
					// `disabled`, not the pending state: an item disabled because another
					// action is running would otherwise show the tooltip explaining why it
					// is INELIGIBLE, which is a different and untrue reason.
					if (!tooltip || !disabled) {
						return menuItem;
					}
					return (
						<Tooltip key={key} title={tooltip}>
							{/* Span so the tooltip still fires over the disabled item. */}
							<span style={{ display: "block" }}>{menuItem}</span>
						</Tooltip>
					);
				})}
			</Menu>
		</Stack>
	);
}
