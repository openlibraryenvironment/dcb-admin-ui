import { HostLMS } from "./HostLMS";
import { Pageable } from "./Pageable";

export interface HostLmsPage {
	// content: [HostLMS]
	totalSize: number;
	content: {
		hostLms: {
			content: [HostLMS];
		};
	};
	pageable: Pageable;
}
