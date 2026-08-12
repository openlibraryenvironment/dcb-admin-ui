import PrivateData from "@components/PrivateData/PrivateData";
import { Grid } from "@mui/material";
import ConfigItem from "./ConfigItem";
import { useTranslation } from "react-i18next";

export default function KohaConfig({ config }: { config: any }) {
	const { t } = useTranslation();

	return (
		<>
			{/* KohaClientConfig reads "api-url", not "base-url". */}
			<ConfigItem
				title={t("hostlms.config_fields.koha_api_url")}
				value={config?.["api-url"]}
				type="url"
			/>
			<Grid size={{ xs: 2, sm: 4, md: 4 }}>
				<PrivateData
					clientConfigType={t("hostlms.config_fields.koha_client_id")}
					hiddenTextValue={config?.client_id}
					id="koha-client-id"
				/>
			</Grid>
			<Grid size={{ xs: 2, sm: 4, md: 4 }}>
				<PrivateData
					clientConfigType={t("hostlms.config_fields.koha_client_secret")}
					hiddenTextValue={config?.client_secret}
					id="koha-client-secret"
				/>
			</Grid>
			<ConfigItem
				title={t("hostlms.client_config.sharing_library")}
				value={config?.["sharing-library-code"]}
			/>
			<ConfigItem
				title={t("hostlms.client_config.virtual_library")}
				value={config?.["virtual-item-library-code"]}
			/>
			<ConfigItem
				title={t("hostlms.client_config.virtual_location")}
				value={config?.["virtual-item-location-code"]}
			/>
			<ConfigItem
				title={t("hostlms.client_config.page_size")}
				value={config?.["page-size"]}
			/>
		</>
	);
}
