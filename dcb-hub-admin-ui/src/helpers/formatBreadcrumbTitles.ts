export function formatBreadcrumbTitles(title: string): string {
	const match = title.match(/for (.+)$/);
	// If no match this falls back to the title attribute.
	// It's intended for situations where the title is "Contacts for [Entity]", for example, and we just need the entity name
	return match ? match[1] : title;
}
