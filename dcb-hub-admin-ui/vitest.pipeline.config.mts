import { defineConfig } from "vitest/config";

// The checks of the pipeline file itself run locally, not in the pipeline: docs/testing.md,
// "The pipeline checks are local".
export default defineConfig({
	test: { include: ["pipeline-checks/**/*.test.ts"] },
});
