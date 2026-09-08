import PrivateData from "@components/PrivateData/PrivateData";
import ConfigItem from "./ConfigItem";
import { Grid } from "@mui/material";
import { useTranslation } from "react-i18next";

export default function AlmaConfig({ config }: { config: any }) {
	const { t } = useTranslation();

	return (
		<>
			<ConfigItem
				title={t("hostlms.client_config.base_url", "Alma URL")}
				value={config?.["alma-url"]}
				type="url"
			/>
			<Grid size={{ xs: 2, sm: 4, md: 4 }}>
				<PrivateData
					clientConfigType={t("hostlms.client_config.api")}
					hiddenTextValue={config?.apikey}
					id="alma-apikey"
				/>
			</Grid>
			<ConfigItem
				title={t("hostlms.client_config.item_policy", "Item Policy")}
				value={config?.["item-policy"]}
			/>
			<ConfigItem
				title={t("hostlms.client_config.shelf_location", "Shelf Location")}
				value={config?.["shelf-location"]}
			/>
			<ConfigItem
				title={t("hostlms.client_config.pickup_circ_desk", "Pickup Circ Desk")}
				value={config?.["pickup-circ-desk"]}
			/>
			<ConfigItem
				title={t(
					"hostlms.client_config.default_circ_desk",
					"Default Circ Desk",
				)}
				value={config?.["default-circ-desk-code"]}
			/>
			<ConfigItem
				title={t("hostlms.client_config.user_identifier", "User Identifier")}
				value={config?.["user-identifier"]}
			/>
			<ConfigItem
				title={t(
					"hostlms.client_config.virtual_location",
					"Virtual Item Location Code",
				)}
				value={config?.["virtual-item-location-code"]}
			/>
			<ConfigItem
				title={t(
					"hostlms.client_config.virtual_library",
					"Virtual Item Library Code",
				)}
				value={config?.["virtual-item-library-code"]}
			/>
			<ConfigItem
				title={t(
					"hostlms.client_config.sharing_library",
					"Sharing Library Code",
				)}
				value={config?.["sharing-library-code"]}
			/>
		</>
	);
}
