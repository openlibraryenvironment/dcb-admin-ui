/** symposia-ui's staff pages under VITE_DISCOVERY_URL, or null unless that is an http(s) address. */
export function discoveryStaffUrl(
	discoveryUrl: string | undefined,
): string | null {
	if (!discoveryUrl) return null;
	try {
		// A base without a trailing slash would resolve "staff" in place of its last segment.
		const base = new URL(
			discoveryUrl.endsWith("/") ? discoveryUrl : `${discoveryUrl}/`,
		);
		if (base.protocol !== "https:" && base.protocol !== "http:") return null;
		return new URL("staff", base).href;
	} catch {
		return null;
	}
}
