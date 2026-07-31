import React from "react";
import { Box, Button, Menu, MenuItem, Stack, Tooltip } from "@mui/material";
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
}

export default function PageActionsMenu({
	actions,
	mode = "view",
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
		<Box>
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
							disabled={disabled}
						>
							{startIcon && <span style={{ marginRight: 8 }}>{startIcon}</span>}
							{label}
						</MenuItem>
					);
					// Only a disabled item gets the span-wrapped tooltip; an enabled
					// item stays a bare MenuItem so it remains keyboard-navigable.
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
		</Box>
	);
}
