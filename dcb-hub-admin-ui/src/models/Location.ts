import { Agency } from "./Agency";
import { HostLMS } from "./HostLMS";

export interface Location {
	agency: Agency;
	type: string;
	id: string;
	code: string;
	name: string;
	longitude: number;
	latitude: number;
	localId: string;
	isPickup: boolean;
	locationReference: string;
	deliveryStops: string;
	printLabel: string;
	hostSystem: HostLMS;
}
