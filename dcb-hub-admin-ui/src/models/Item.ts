import { Agency } from "./Agency";
import { Location } from "./Location";

export interface Item {
	id: string;
	status: string;
	dueDate: string;
	location: Location;
	barcode: string;
	callNumber: string;
	isRequestable: boolean;
	holdCount: number;
	localBibId: string;
	localItemType: string;
	localItemTypeCode: string;
	canonicalItemType: string;
	deleted: boolean;
	isSuppressed: boolean;
	agency: Agency;
	owningContext: string;
	availabilityDate: string;
	parsedVolumeStatement: string;
	rawVolumeStatement: string;
	hostLmsCode: string;
	sourceHostLmsCode: string;
	rawDataValues: Map<string, string>;
	decisionLogEntries: Array<string>;
	statusCorrectAsOf: string;
}
