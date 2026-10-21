export interface HostLMS {
	id: string;
	code: string;
	name: string;
	lmsClientClass: string;
	clientConfig: any;
	itemSuppressionRulesetName: string;
	suppressionRulesetName: string;
	ingestSourceClass: string;
	/** Selected only with VITE_FEATURE_HOST_LMS_PROBES; absent otherwise. */
	lastPing?: unknown;
}
