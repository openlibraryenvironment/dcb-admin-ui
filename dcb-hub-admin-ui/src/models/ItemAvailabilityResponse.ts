import { Item } from "./Item";
import { Timing } from "./Timing";

export interface ItemAvailabilityResponse {
	itemList: Item[];
	timings: Timing;
	bibClusterId: string;
	errors: any[];
}
