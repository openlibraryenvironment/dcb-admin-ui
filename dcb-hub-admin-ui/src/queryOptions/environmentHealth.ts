import { queryOptions } from "@tanstack/react-query";
import axios from "axios";

import { nonCriticalQuery } from "@helpers/queryPolicy";
import { calculateDCBRAGStatus } from "@helpers/calculateDCBRAGStatus";
import { calculateKeycloakRAGStatus } from "@helpers/calculateKeycloakRAGStatus";
import { settledJsonBody } from "@helpers/settledJsonBody";
import { LOCAL_VERSION_LINKS } from "@/homeData/homeConfig";

// Per request. One endpoint that never answers held both pages that render this on their
// spinner indefinitely; with the liveness fallback the query settles within twice this.
export const ENVIRONMENT_REQUEST_TIMEOUT_MS = 10_000;

export interface TrackingConfigurationData {
	trackingIntervals: Record<string, string>;
	globalActiveRequestLimit: number;
	globalTrackingInterval: string;
}

type RagStatus = ReturnType<typeof calculateDCBRAGStatus>;

export interface EnvironmentHealth {
	/** False when dcb-service's /info could not be reached at all. */
	serviceInfoReached: boolean;
	/** /info's body, or null when it was unreachable or not a JSON object. */
	serviceInfo: unknown;
	dcbHealth: { status: RagStatus; link: string };
	keycloakStatus: RagStatus;
	trackingConfig: TrackingConfigurationData | null;
}

type Request = { timeout: number; signal: AbortSignal };

async function fetchDcbHealth(request: Request) {
	try {
		const res = await axios.get(LOCAL_VERSION_LINKS.SERVICE_HEALTH, request);
		return {
			status: calculateDCBRAGStatus(res.data),
			link: LOCAL_VERSION_LINKS.SERVICE_HEALTH,
		};
	} catch (err: any) {
		const livenessEndpoint = LOCAL_VERSION_LINKS.SERVICE_HEALTH.replace(
			"/health",
			"/health/liveness",
		);
		try {
			const livenessRes = await axios.get(livenessEndpoint, request);
			if (livenessRes.status === 200) {
				return { status: "Up" as const, link: livenessEndpoint };
			}
		} catch {
			// Neither answered: report what the health check's own error carried
		}
		return {
			status: calculateDCBRAGStatus(err.response?.data),
			link: LOCAL_VERSION_LINKS.SERVICE_HEALTH,
		};
	}
}

export async function fetchEnvironmentHealth(
	accessToken: string | undefined,
	signal: AbortSignal,
): Promise<EnvironmentHealth> {
	const request: Request = { timeout: ENVIRONMENT_REQUEST_TIMEOUT_MS, signal };

	const [info, dcbHealth, keycloak, tracking] = await Promise.allSettled([
		axios.get(LOCAL_VERSION_LINKS.SERVICE_INFO, request),
		fetchDcbHealth(request),
		axios.get(LOCAL_VERSION_LINKS.KEYCLOAK_HEALTH, request),
		axios.get(LOCAL_VERSION_LINKS.TRACKING, {
			...request,
			headers: { Authorization: `Bearer ${accessToken}` },
		}),
	]);

	return {
		serviceInfoReached: info.status === "fulfilled",
		// Narrowed rather than cast: a 200 carrying an HTML document is a fulfilled
		// promise, and casting one to its response type crashed both pages that render
		// this. See settledJsonBody.
		serviceInfo: settledJsonBody(info),
		dcbHealth:
			dcbHealth.status === "fulfilled"
				? dcbHealth.value
				: { status: "Undefined", link: LOCAL_VERSION_LINKS.SERVICE_HEALTH },
		keycloakStatus: calculateKeycloakRAGStatus(
			keycloak.status === "fulfilled"
				? keycloak.value.data
				: (keycloak.reason as any)?.response?.data,
		),
		trackingConfig: settledJsonBody<TrackingConfigurationData>(tracking),
	};
}

export const environmentHealthQueryKey = ["environmentHealth"] as const;

export const environmentHealthQuery = (accessToken: string | undefined) =>
	queryOptions({
		...nonCriticalQuery,
		queryKey: environmentHealthQueryKey,
		queryFn: ({ signal }) => fetchEnvironmentHealth(accessToken, signal),
		enabled: !!accessToken,
	});
