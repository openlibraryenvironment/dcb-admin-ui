import { HostLMS } from "./HostLMS";

export interface Agency {
	id: number;
	code: string;
	name: string;
	hostlms: HostLMS;
	authProfile: string;
	longitude: number;
	latitude: number;
}
