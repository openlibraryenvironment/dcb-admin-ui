import { ProcessingStatus } from "./ProcessingStatus";

export interface SourceRecord {
	id: string;
	hostLmsId: string;
	remoteId: string;
	lastFetched: string;
	lastProcessed: string;
	processingState: ProcessingStatus;
	processingInformation: string;
	sourceRecordData: JSON;
}
