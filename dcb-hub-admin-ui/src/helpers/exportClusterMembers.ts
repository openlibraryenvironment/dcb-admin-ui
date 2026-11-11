import axios, { AxiosInstance } from "axios";
import { isHandledGlobally } from "@helpers/globalHttpErrors";

import { downloadBlob } from "@helpers/downloadBlob";
import { requestReferenceOf } from "@helpers/requestReference";

export type ClusterExportOutcome =
	| { kind: "downloaded" }
	/** dcb-service answers 204 for a cluster with no member bibs. */
	| { kind: "empty" }
	| { kind: "forbidden" }
	| { kind: "failed"; reference: string | null };

/**
 * Downloads a zip of the canonical metadata of every bib in the cluster. dcb-service
 * labels the zip application/json, so it is read as a blob whatever the header says.
 */
export const exportClusterMembers = async (
	client: AxiosInstance,
	clusterId: string,
): Promise<ClusterExportOutcome> => {
	try {
		const response = await client.get<Blob>(
			`/clusters/${encodeURIComponent(clusterId)}/exportMembers`,
			{ responseType: "blob" },
		);
		if (response.status === 204 || !response.data?.size)
			return { kind: "empty" };

		downloadBlob(
			`cluster-${clusterId}-records.zip`,
			new Blob([response.data], { type: "application/zip" }),
		);
		return { kind: "downloaded" };
	} catch (error) {
		if (isHandledGlobally(error)) throw error;
		if (axios.isAxiosError(error) && error.response?.status === 403)
			return { kind: "forbidden" };
		return { kind: "failed", reference: requestReferenceOf(error) };
	}
};
