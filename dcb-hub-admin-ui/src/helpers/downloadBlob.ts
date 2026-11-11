/**
 * Hand a file to the reader.
 *
 * An object URL rather than a data URI: a data URI large enough to matter is refused by
 * some browsers, and this one is revoked once the click has been handled.
 */
export function downloadBlob(name: string, blob: Blob): void {
	const url = URL.createObjectURL(blob);

	const anchor = document.createElement("a");
	anchor.href = url;
	anchor.download = name;
	anchor.click();

	// Revoked on the next task, not now: Firefox and Safari can start the download after
	// click() returns, and a URL revoked first downloads nothing
	setTimeout(() => URL.revokeObjectURL(url), 0);
}
