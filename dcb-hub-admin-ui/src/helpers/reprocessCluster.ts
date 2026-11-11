import axios, { AxiosInstance } from "axios";
import { isHandledGlobally } from "@helpers/globalHttpErrors";

import { requestReferenceOf } from "@helpers/requestReference";

export type ClusterReprocessOutcome =
	| { kind: "started" }
	| { kind: "forbidden" }
	| { kind: "failed"; reference: string | null };

/**
 * Asks dcb-service to disperse the cluster and queue its members for clustering again.
 * It answers 202 before any of that has run (8.71.0-9.3.0), so "started" is all it can say.
 * Not POST /admin/reprocess/{clusterId}: on those releases it answers "Completed" and
 * updates nothing, because the update it builds is never subscribed.
 */
export const reprocessCluster = async (
	client: AxiosInstance,
	clusterId: string,
): Promise<ClusterReprocessOutcome> => {
	try {
		await client.post(`/clusters/${encodeURIComponent(clusterId)}/reprocess`);
		return { kind: "started" };
	} catch (error) {
		if (isHandledGlobally(error)) throw error;
		if (axios.isAxiosError(error) && error.response?.status === 403)
			return { kind: "forbidden" };
		return { kind: "failed", reference: requestReferenceOf(error) };
	}
};
