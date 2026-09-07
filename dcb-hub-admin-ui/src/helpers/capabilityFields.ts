import {
	SERVICE_CAPABILITIES,
	capability,
} from "@constants/serviceCapabilities";

/**
 * Turning the capability registry into selection sets and mutation variables — R-19.
 *
 * The registry says WHICH fields belong to which dcb-service release. This says what to
 * do about it: leave them out of the document, and strip them from the variables. Both,
 * always — an undeclared input field fails a mutation exactly as an undeclared output
 * field fails a query, and blanking a key is not the same as omitting it.
 *
 * Nothing here is per-feature. Adding a capability is a row in the registry; this module
 * does not change. `consortiumBrandSelection` stays hand-written beside it because that
 * capability is not a plain field list: it has a chrome/full distinction and a legacy
 * fallback, and generalising those would put two callers' worth of special case in here.
 */

/**
 * The fields to select for `id` on `type`, indented to sit inside a `gql` template.
 *
 * Returns the capability's fields when the deployment has them, its `fallback` for that
 * type when it has an older equivalent, and the empty string otherwise.
 *
 * **Call this at query time, never at module scope.** The flags are read from
 * `window.__APP_ENV__`, which `application.tsx` assigns only after awaiting
 * `inject_env.json` — long after the document modules evaluate. A selection built at
 * module scope reads every flag as off, in every environment, and the bug is invisible
 * because the app still works: it just silently runs in legacy mode forever.
 */
export const capabilitySelection = (id: string, type: string): string => {
	const entry = capability(id);
	const fields = entry.enabled()
		? entry.fields[type]
		: (entry.fallback?.[type] ?? []);

	return (fields ?? []).join("\n\t\t\t\t");
};

/**
 * Every input-type field this deployment's dcb-service cannot accept.
 *
 * Derived from the registry rather than listed, so a capability added there is stripped
 * without anyone remembering to come here.
 */
export const unsupportedInputKeys = (): ReadonlySet<string> => {
	const keys = new Set<string>();

	for (const entry of SERVICE_CAPABILITIES) {
		if (entry.enabled()) continue;

		for (const [type, fields] of Object.entries(entry.fields)) {
			// Input types only. An object type's fields are a selection-set problem and
			// are handled by capabilitySelection; stripping them from variables would do
			// nothing and would hide a real mistake.
			if (!type.endsWith("Input")) continue;
			fields.forEach((field) => keys.add(field));
		}
	}

	return keys;
};
