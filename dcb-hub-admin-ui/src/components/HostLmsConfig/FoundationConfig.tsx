import PrivateData from "@components/PrivateData/PrivateData";
import { Grid } from "@mui/material";
import ConfigItem from "./ConfigItem";
import { useTranslation } from "react-i18next";

/**
 * The Foundation connector composes a base protocol, so what is worth showing
 * depends on which one it selected. NCIP when unset, matching FoundationClient.
 */
export default function FoundationConfig({ config }: { config: any }) {
	const { t } = useTranslation();

	const imperative = config?.capabilities?.imperative ?? {};
	const protocol = String(
		imperative["base-protocol"] ?? config?.["base-protocol"] ?? "NCIP",
	);
	const isSip2 = protocol.toUpperCase() === "SIP2";
	const sip2 = config?.sip2 ?? {};

	return (
		<>
			<ConfigItem
				title={t("hostlms.config_fields.base_protocol")}
				value={protocol}
			/>

			{!isSip2 && (
				<ConfigItem
					title={t("hostlms.config_fields.ncip_endpoint_url")}
					value={
						imperative["ncip-endpoint-url"] ??
						config?.["ncip-endpoint-url"] ??
						config?.ncip?.endpoint
					}
					type="url"
				/>
			)}

			{isSip2 && (
				<>
					<ConfigItem
						title={t("hostlms.config_fields.sip2_host")}
						value={sip2.host}
					/>
					<ConfigItem
						title={t("hostlms.config_fields.sip2_port")}
						value={sip2.port}
					/>
					<ConfigItem
						title={t("hostlms.config_fields.sip2_login")}
						value={sip2.login}
					/>
					<Grid size={{ xs: 2, sm: 4, md: 4 }}>
						<PrivateData
							clientConfigType={t("hostlms.config_fields.sip2_pass")}
							hiddenTextValue={sip2.pass}
							id="foundation-sip2-pass"
						/>
					</Grid>
					<ConfigItem
						title={t("hostlms.config_fields.sip2_location_code")}
						value={sip2.locationCode}
					/>
				</>
			)}

			<ConfigItem
				title={t("hostlms.config_fields.foundation_overrides")}
				value={
					imperative.overrides
						? Object.entries(imperative.overrides)
								.map(([operation, strategy]) => `${operation}: ${strategy}`)
								.join(", ")
						: undefined
				}
			/>
		</>
	);
}
