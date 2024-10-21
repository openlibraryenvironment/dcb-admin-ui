import { Alert as MUIAlert, AlertTitle, IconButton } from "@mui/material";
import { capitalize } from "@mui/material/utils";
import { useTranslation } from "next-i18next";
import { MdClose } from "react-icons/md";

interface AlertProps {
	severityType: any;
	onCloseFunc?: any;
	variant?: any;
	textColor?: string;
	titleShown?: boolean;
	closeButtonShown?: boolean;
	alertText?: any;
}

export default function Alert({
	severityType,
	onCloseFunc,
	variant,
	textColor,
	titleShown,
	closeButtonShown,
	alertText,
}: AlertProps) {
	const { t } = useTranslation();
	return (
		<>
			<MUIAlert
				severity={severityType}
				onClose={onCloseFunc}
				variant={variant}
				action={
					closeButtonShown ? (
						<IconButton
							size="small"
							onClick={onCloseFunc}
							title={t("ui.action.close_alert")}
						>
							<MdClose color={textColor} />
						</IconButton>
					) : null
				}
			>
				{titleShown != false ? (
					<AlertTitle color={textColor}>{capitalize(severityType)}</AlertTitle>
				) : null}
				{alertText}
			</MUIAlert>
		</>
	);
}
