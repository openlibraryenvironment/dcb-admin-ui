import { useState } from "react";
import { Button, Menu, MenuItem } from "@mui/material";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { useTranslation } from "next-i18next";

interface Action {
	key: string;
	onClick: () => void;
	disabled?: boolean;
	label: string;
	startIcon?: React.ReactNode;
}

interface MoreActionsMenuProps {
	actions: Action[];
	buttonText?: string;
}

const MoreActionsMenu: React.FC<MoreActionsMenuProps> = ({
	actions,
	buttonText,
}) => {
	const { t } = useTranslation();
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

	const handleClick = (event: React.MouseEvent<HTMLElement>) => {
		setAnchorEl(event.currentTarget);
	};

	const handleClose = () => {
		setAnchorEl(null);
	};

	return (
		<>
			<Button
				color="primary"
				variant="contained"
				onClick={handleClick}
				endIcon={<ArrowDropDownIcon />}
			>
				{buttonText ?? t("ui.data_grid.actions")}
			</Button>
			<Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
				{actions.map(({ key, onClick, disabled, label, startIcon }) => (
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
				))}
			</Menu>
		</>
	);
};

export default MoreActionsMenu;
