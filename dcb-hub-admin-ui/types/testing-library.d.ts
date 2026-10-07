/**
 * jest-dom's matchers, for the type checker.
 *
 * vitest.setup.ts registers them at runtime; without this reference `tsc` does not
 * know `toBeInTheDocument` exists and the component tests fail to type-check while
 * passing. Here rather than in a tsconfig `types` entry because this directory is
 * already what tsconfig includes for ambient declarations.
 */
/// <reference types="@testing-library/jest-dom/vitest" />
