/* eslint-disable-next-line no-restricted-imports -- this IS the configured instance;
   everything else imports it from here. */
import { z } from "zod";

/**
 * The only configured Zod instance - import `z` from here, never from `"zod"`.
 *
 * Zod 4 compiles validators with `new Function` and feature-detects support by calling
 * `Function("")`. This application ships a Content Security Policy with no
 * `'unsafe-eval'`, so that call is refused; Zod catches the refusal and falls back to the
 * interpreted path, so validation keeps working - but the BROWSER still raises a
 * `securitypolicyviolation` for the attempt. Found by the container gate, which is the
 * only gate that ships the policy: `script-src <- eval` from the `schemas` chunk.
 *
 * `jitless` is Zod's own switch for this, and it changes no behaviour we rely on - the
 * fallback is what was already running.
 *
 * IT HAS TO BE SET BEFORE THE FIRST SCHEMA IS CONSTRUCTED, not merely before the first
 * parse: measured, `z.object({...})` alone fires the probe. Setting it from the app entry
 * is therefore not enough, because the bundler is free to execute a chunk holding a
 * route's module-scope schema before the entry's body runs - which is exactly what
 * happened, and the violation survived. A module every schema imports cannot be ordered
 * after them.
 *
 * `no-restricted-imports` in eslint.config.mjs keeps the next schema from reaching for
 * `"zod"` directly.
 */
z.config({ jitless: true });

export { z };
