export function getLocalId(ils: string): string {
	switch (ils) {
		case "FOLIO":
			return "locations.new.service_point";
		case "Polaris":
			return "locations.new.polaris_org";
		case "Sierra":
			return "locations.new.sierra";
		default:
			return "details.local_id";
	}
}
