import { HOST_LMS_PROBE_FIELDS } from "@constants/serviceCapabilities";
import { isHostLmsProbesEnabled } from "@helpers/featureFlags";

/** A function, like the documents using it: the flag is not set until after module load. */
export const hostLmsProbesSelection = (): string =>
	isHostLmsProbesEnabled() ? HOST_LMS_PROBE_FIELDS.join("\n\t\t\t") : "";
