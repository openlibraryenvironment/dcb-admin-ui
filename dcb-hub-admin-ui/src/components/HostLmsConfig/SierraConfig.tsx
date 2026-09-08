import PrivateData from "@components/PrivateData/PrivateData";
import { Grid } from "@mui/material";
import ConfigItem from "./ConfigItem";
import { useTranslation } from "react-i18next";

export default function SierraConfig({ config }: { config: any }) {
	const { t } = useTranslation();

	return (
		<>
			<ConfigItem
				title={t("hostlms.client_config.base")}
				value={config?.["base-url"]}
				type="url"
			/>
			<Grid size={{ xs: 2, sm: 4, md: 4 }}>
				<PrivateData
					clientConfigType={t("hostlms.client_config.key")}
					hiddenTextValue={config?.key}
					id="sierra-key"
				/>
			</Grid>
			<Grid size={{ xs: 2, sm: 4, md: 4 }}>
				<PrivateData
					clientConfigType={t("hostlms.client_config.secret")}
					hiddenTextValue={config?.secret}
					id="sierra-secret"
				/>
			</Grid>
		</>
	);
}
