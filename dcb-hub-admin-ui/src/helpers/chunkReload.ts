import { storageKey } from "@helpers/appBase";

/**
 * Recovery from a lazy chunk that no longer exists.
 *
 * <h2>The failure this exists for</h2>
 *
 * `autoCodeSplitting` makes every one of the 84 routes a dynamic import, and a deploy
 * removes the previous build's hashed chunks (`aws s3 sync --delete`, and the R2 channel
 * likewise). A browser that is still holding the OLD index.html therefore asks for file
 * names that are gone, and every navigation fails with "Failed to fetch dynamically
 * imported module" — a blank page, on every hosting provider, for as long as that tab
 * lives. Vite fires `vite:preloadError` on `window` for exactly this case; nothing was
 * listening.
 *
 * Reloading is the fix rather than a retry, because the stale artefact is the index.html
 * itself: the names this tab is asking for do not exist anywhere, and only a fresh
 * document will name the ones that do.
 *
 * <h2>Why the guard is not optional</h2>
 *
 * If the newly-fetched shell is ALSO broken — a half-finished sync, an asset path that
 * 404s, a CDN serving a mixed generation — an unconditional reload is an infinite refresh
 * loop, which is materially worse than the blank page it replaces: the user cannot read an
 * error, cannot open devtools, and cannot navigate away.
 *
 * So the first failure reloads once and records that it did. A second failure is left
 * alone: `preventDefault` is NOT called, the error propagates as Vite intended, and it
 * lands on the router's `defaultErrorComponent` — a translated page with a "go back"
 * button, which is the correct end state for a deployment that is genuinely broken.
 *
 * The record lives in sessionStorage, not localStorage: it is scoped to this tab and this
 * visit, and a guard that outlived the session would suppress the reload for a completely
 * unrelated deploy weeks later.
 */
export const chunkReloadGuardKey = (): string =>
	storageKey("chunk-reload-attempted");

/**
 * The listener itself, exported so it can be tested without a router or a real deploy.
 *
 * Returns whether it triggered a reload, which is the only observable a test has: the
 * reload replaces the document, so nothing after it runs.
 */
export function handleChunkPreloadError(event: Event): boolean {
	if (sessionStorage.getItem(chunkReloadGuardKey())) {
		return false;
	}

	event.preventDefault();
	sessionStorage.setItem(chunkReloadGuardKey(), "1");
	window.location.reload();
	return true;
}

/** Cleared once a navigation has actually completed, so the next deploy gets its one go. */
export function clearChunkReloadGuard(): void {
	sessionStorage.removeItem(chunkReloadGuardKey());
}

export function installChunkReloadGuard(): void {
	window.addEventListener("vite:preloadError", handleChunkPreloadError);
}
