import { Alert as MUIAlert, AlertTitle, IconButton } from "@mui/material";
import { capitalize } from "@mui/material/utils";
import { useTranslation } from "next-i18next";
import { MdClose } from "react-icons/md";

export default function Alert(props: any) {
	const { t } = useTranslation();
	return (
		<>
			<MUIAlert
				severity={props.severityType}
				onClose={props.onCloseFunc}
				variant={props.variant}
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
