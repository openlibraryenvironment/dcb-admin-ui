import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { calculateDCBRAGStatus } from "src/helpers/calculateDCBRAGStatus";
import { calculateKeycloakRAGStatus } from "src/helpers/calculateKeycloakRAGStatus";
import Loading from "@components/Loading/Loading";
import { useTranslation } from "next-i18next";
import { Typography } from "@mui/material";
import { Environment } from "@models/Environment";

export default function EnvironmentHealth({
	apiLink,
	environment,
}: {
	apiLink: string;
	environment: Environment;
}) {
	const [healthData, setHealthData] = useState<any | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const { t } = useTranslation();

	const calculateRAGStatus = useMemo(() => {
		if (!healthData) return "Undefined";

		switch (environment) {
			case Environment.DCB:
				return calculateDCBRAGStatus(healthData);
			case Environment.Keycloak:
				return calculateKeycloakRAGStatus(healthData);
			default:
				return "Undefined";
		}
	}, [healthData, environment]);

	useEffect(() => {
		const fetchHealthData = async () => {
			try {
				setIsLoading(true);
				const response = await axios.get(apiLink);
				setHealthData(response.data);
			} catch (error: any) {
				if (error.response) {
					// If there's a response, set the health data from the response
					setHealthData(error.response.data);
				} else {
					// Set a more informative error
					setError(error.message || "Failed to fetch health data");
				}
			} finally {
				setIsLoading(false);
			}
		};

		fetchHealthData();
	}, [apiLink]);

	if (isLoading)
		return (
			<Loading
				title={t("ui.info.loading.document", {
					document_type: t("service.environment_health").toLowerCase(),
				})}
				subtitle={t("ui.info_wait")}
			/>
		);
	if (error)
		return (
			<Typography>
				{t("service.environment_health_error", { error: error })}
			</Typography>
		);

	return <>{calculateRAGStatus}</>;
}
