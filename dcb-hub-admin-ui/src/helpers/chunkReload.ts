import { storageKey } from "@helpers/appBase";

/**
 * Recovery from a lazy chunk that a deploy has removed. See docs/deployment.md.
 */
export const chunkReloadGuardKey = (): string =>
	storageKey("chunk-reload-attempted");

/**
 * Returns whether it reloaded, which is the only observable a test has: the reload replaces
 * the document, so nothing after it runs.
 */
export function handleChunkPreloadError(event: Event): boolean {
	// A SECOND failure is left alone, and `preventDefault` deliberately not called: the
	// error propagates to the router's boundary instead of looping the tab forever.
	if (sessionStorage.getItem(chunkReloadGuardKey())) {
		return false;
	}

	event.preventDefault();
	sessionStorage.setItem(chunkReloadGuardKey(), "1");
	window.location.reload();
	return true;
}

/** Cleared once a navigation has resolved, so the next deploy gets its own single attempt. */
export function clearChunkReloadGuard(): void {
	sessionStorage.removeItem(chunkReloadGuardKey());
}

export function installChunkReloadGuard(): void {
	window.addEventListener("vite:preloadError", handleChunkPreloadError);
}
