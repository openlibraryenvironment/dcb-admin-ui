/**
 * Hand a file to the reader.
 *
 * An object URL rather than a data URI: a data URI large enough to matter is refused by
 * some browsers, and this one is revoked as soon as the click is dispatched.
 */
export function downloadBlob(name: string, blob: Blob): void {
	const url = URL.createObjectURL(blob);

	const anchor = document.createElement("a");
	anchor.href = url;
	anchor.download = name;
	anchor.click();

	URL.revokeObjectURL(url);
}
