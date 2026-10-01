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
