import { PatronRequest } from "./PatronRequest";

export interface AuditItem {
    id: string;
    auditDate: string;
    briefDescription: string;
    fromStatus: string;
    toStatus: string;
    auditData:
    {
        toState: string;
        fromState: string;
        resourceId: string;
        resourceType: string;
        patronRequestId: string;
    }
    patronRequest: PatronRequest;
}