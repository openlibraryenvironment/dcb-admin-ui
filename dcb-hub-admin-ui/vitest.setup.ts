/**
 * jest-dom's matchers, for the component tests that opt into a DOM.
 *
 * Safe in the default `node` environment too: the import only calls expect.extend,
 * and a matcher nobody uses costs nothing. The 1,486 tests that run without a DOM are
 * unaffected - see docs/testing.md, "A component test opts into a DOM".
 */
import "@testing-library/jest-dom/vitest";
import { ALL_FEATURE_FLAGS } from "@constants/serviceCapabilities";

/**
 * Feature flags start off in every test file, whatever the developer's `.env` says.
 *
 * `readFlag` resolves `window.__APP_ENV__?.[name] ?? import.meta.env[name]`, and vite
 * populates `import.meta.env` from `.env` - so a flag set locally changed the outcome of
 * every test that means "a deployment that has never heard of this flag".
 *
 * Cleared by assignment, not `vi.stubEnv`, so a test's own `vi.unstubAllEnvs()` cannot put
 * the developer's environment back. Tests that want a flag ON set `window.__APP_ENV__`.
 */
const env = import.meta.env as unknown as Record<string, unknown>;

for (const flag of ALL_FEATURE_FLAGS) {
	env[flag] = "";
}
