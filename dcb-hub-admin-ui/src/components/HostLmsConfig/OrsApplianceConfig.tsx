import ConfigItem from "./ConfigItem";
import { useTranslation } from "react-i18next";

/**
 * NcipHostLmsConfiguration reads the NCIP identifiers in both kebab-case and
 * camelCase, so the display has to look for both - configuration written by the
 * DCB profile registration flow uses kebab-case, hand-written config may not.
 */
export default function OrsApplianceConfig({ config }: { config: any }) {
	const { t } = useTranslation();

	return (
		<>
			<ConfigItem
				title={t("hostlms.config_fields.ncip_endpoint_url")}
				value={config?.["ncip-endpoint-url"]}
				type="url"
			/>
			<ConfigItem
				title={t("hostlms.config_fields.ncip_system_id")}
				value={config?.["ncip-system-id"] ?? config?.ncipSystemId}
			/>
			<ConfigItem
				title={t("hostlms.config_fields.ncip_agency_id")}
				value={config?.["ncip-agency-id"] ?? config?.ncipAgencyId}
			/>
			<ConfigItem
				title={t("hostlms.config_fields.oai_endpoint_url")}
				value={config?.["oai-endpoint-url"]}
				type="url"
			/>
			<ConfigItem
				title={t("hostlms.config_fields.tenant_id")}
				value={config?.["tenant-id"]}
			/>
			<ConfigItem
				title={t("hostlms.client_config.metadata")}
				value={config?.["metadata-prefix"]}
			/>
			<ConfigItem
				title={t("hostlms.config_fields.ncip_peer_auth_mode")}
				value={config?.["ncip-peer-auth-mode"]}
			/>
			<ConfigItem
				title={t("hostlms.config_fields.ncip_peer_issuer")}
				value={config?.["ncip-peer-issuer"]}
			/>
			<ConfigItem
				title={t("hostlms.config_fields.ncip_peer_jwks_url")}
				value={config?.["ncip-peer-jwks-url"]}
				type="url"
			/>
			<ConfigItem
				title={t("hostlms.config_fields.ncip_peer_audience")}
				value={config?.["ncip-peer-audience"]}
			/>
		</>
	);
}
