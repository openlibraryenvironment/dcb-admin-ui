import { HostLMS } from "./HostLMS";

export interface Agency {
	id: number;
	code: string;
	name: string;
	hostLms: HostLMS;
	authProfile: string;
	longitude: number;
	latitude: number;
	isSupplyingAgency: boolean;
	isBorrowingAgency: boolean;
	maxConsortialLoans: number;
}
