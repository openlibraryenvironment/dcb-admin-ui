import React from "react";
import { Box, Button, Menu, MenuItem, Stack } from "@mui/material";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { useTranslation } from "next-i18next";

export interface Action {
	key: string;
	onClick: () => void;
	disabled?: boolean;
	label: string;
	startIcon?: React.ReactNode;
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
					const { key, onClick, disabled, label, startIcon } = action as Action;
					return (
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
				})}
			</Menu>
		</Box>
	);
}
