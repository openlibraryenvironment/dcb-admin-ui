import type { ScopeOption } from "@components/Insights/ScopeSelector";

/**
 * The stable id a URL carries for one scope option: its kind and its own id, never the
 * Host LMS codes it resolves to.
 *
 * Here rather than beside the selector because a function exported alongside a component
 * breaks fast refresh, and because the route reads it without rendering the selector.
 */
export const scopeId = (option: ScopeOption) => `${option.kind}:${option.id}`;
