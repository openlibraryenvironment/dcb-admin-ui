import PrivateData from "@components/PrivateData/PrivateData";
import ConfigItem from "./ConfigItem";
import { Grid } from "@mui/material";
import { useTranslation } from "react-i18next";

export default function FolioConfig({ config }: { config: any }) {
	const { t } = useTranslation();

	return (
		<>
			<ConfigItem
				title={t("hostlms.client_config.base")}
				value={config?.["base-url"]}
				type="url"
			/>
			<ConfigItem
				title={t("hostlms.client_config.record_syntax")}
				value={config?.["record-syntax"]}
			/>
			<ConfigItem
				title={t("hostlms.client_config.metadata")}
				value={config?.["metadata-prefix"]}
			/>
			<Grid size={{ xs: 2, sm: 4, md: 4 }}>
				<PrivateData
					clientConfigType={t("hostlms.client_config.api")}
					hiddenTextValue={config?.apikey}
					id="folio-apikey"
				/>
			</Grid>
		</>
	);
}
