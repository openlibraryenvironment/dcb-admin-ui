import { Agency } from "./Agency";

export interface Location {
    agency: Agency;
    type: string;
	id: string;
	code: string;
	name: string;
	longitude: number;
	latitude: number;
	isPickup: boolean;
	locationReference: string;
	deliveryStops: string;
	printLabel: string;
}
