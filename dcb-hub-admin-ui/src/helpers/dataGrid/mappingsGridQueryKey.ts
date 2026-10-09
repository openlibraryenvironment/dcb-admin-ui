import type { EntityKey } from "@constants/entityRegistry";

/**
 * The cache key for a mappings grid, rooted on the ENTITY and not on the grid id.
 *
 * `useEntityMutation` invalidates with a predicate over `queryKey[0].startsWith(prefix)`,
 * so a key rooted on a UI identifier is invisible to the edit and delete path.
 * docs/query-error-policy.md, "Keys and invalidation".
 */
export const mappingsGridQueryKey = (
	entity: EntityKey,
	gridId: string,
	...variant: readonly unknown[]
) => [entity, gridId, ...variant] as const;
