import { useState } from "react";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import {
	InputAdornment,
	InputLabel,
	Stack,
	Box,
	IconButton,
	Input,
	FormControl,
	Typography,
	Tooltip,
} from "@mui/material";
import { useTranslation } from "next-i18next";

interface PrivateDataProps {
	hiddenTextValue: string;
	clientConfigType: string;
	id: string;
}

export default function PrivateData({
	hiddenTextValue,
	clientConfigType,
	id,
}: PrivateDataProps) {
	const { t } = useTranslation();
	const [showPrivateData, setShowPrivateData] = useState(false);

	const handleMouseDownPrivateData = (
		event: React.MouseEvent<HTMLButtonElement>,
	) => {
		event.preventDefault();
	};

	return (
		<Box sx={{ display: "flex", flexWrap: "wrap" }}>
			<Stack>
				<Box sx={{ display: "flex", alignItems: "center", width: "100%" }}>
					<InputLabel
						htmlFor={id}
						sx={{ color: "inherit", fontWeight: "bold" }}
					>
						{clientConfigType}
					</InputLabel>
					<InputAdornment position="start">
						<Tooltip
							title={
								showPrivateData
									? t("ui.visibility.hideShown", { field: clientConfigType })
									: t("ui.visibility.showHidden", { field: clientConfigType })
							}
						>
							<IconButton
								aria-label={
									showPrivateData
										? t("ui.visibility.hideShown", { field: clientConfigType })
										: t("ui.visibility.showHidden", { field: clientConfigType })
								}
								onClick={() => setShowPrivateData((show) => !show)}
								onMouseDown={handleMouseDownPrivateData}
							>
								{showPrivateData ? <VisibilityOff /> : <Visibility />}
							</IconButton>
						</Tooltip>
					</InputAdornment>
				</Box>
				<FormControl sx={{ width: "100%" }} variant="standard">
					{showPrivateData ? (
						<Typography
							id={id}
							sx={{
								wordBreak: "break-word",
							}}
						>
							{hiddenTextValue}
						</Typography>
					) : (
						<Input
							// pass in a value for the id for each instance
							// this solves issues with duplicate ids
							id={id}
							type="password"
							defaultValue={hiddenTextValue}
							disableUnderline
							inputProps={{
								readOnly: true,
								tabIndex: -1,
								"aria-hidden": true,
							}}
						/>
					)}
				</FormControl>
			</Stack>
		</Box>
	);
}
