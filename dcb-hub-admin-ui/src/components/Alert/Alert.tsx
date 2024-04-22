import {
	Alert as MUIAlert,
	AlertTitle,
	IconButton,
	useTheme,
} from "@mui/material";
import { capitalize } from "@mui/material/utils";
import { useTranslation } from "next-i18next";
import { MdClose, MdOutlineInfo } from "react-icons/md";

export default function Alert(props: any) {
	const theme = useTheme();
	const { t } = useTranslation();
	return (
		<>
			<MUIAlert
				severity={props.severityType}
				onClose={props.onCloseFunc}
				variant={props.variant}
				iconMapping={{
					info: <MdOutlineInfo color={theme.palette.common.white} size={20} />,
				}}
				action={
					<IconButton
						size="small"
						onClick={props.onCloseFunc}
						title={t("ui.action.close_alert")}
					>
						<MdClose color={props.textColor} />
					</IconButton>
				}
			>
				{props.titleShown != false ? (
					<AlertTitle color={props.textColor}>
						{capitalize(props.severityType)}
					</AlertTitle>
				) : null}
				{props.alertText}
			</MUIAlert>
		</>
	);
}
