/**
 * The human name for a Host LMS client class.
 *
 * Matched on distinctive substrings of the fully-qualified class name rather
 * than on equality, because the same ILS can have more than one client class
 * over time. The appliance is checked before the generic cases because its
 * class lives outside the `core.interaction` package.
 */
export function getILS(lmsClientClass: string): string {
	const clientClass = lmsClientClass?.toLowerCase() ?? "";

	switch (true) {
		case clientClass.includes("alma"):
			return "Alma";
		case clientClass.includes("folio"):
			return "FOLIO";
		case clientClass.includes("koha"):
			return "Koha";
		case clientClass.includes("polaris"):
			return "Polaris";
		case clientClass.includes("sierra"):
			return "Sierra";
		// org.olf.dcb.request.lifecycle.ncip.ORSApplianceHostLMS
		case clientClass.includes("orsappliance"):
			return "OpenRS appliance";
		// org.olf.dcb.core.interaction.foundation.FoundationClient - the
		// protocol-composition connector, not an ILS product name.
		case clientClass.includes("foundation"):
			return "Foundation";
		default:
			return "UNKNOWN";
	}
}
