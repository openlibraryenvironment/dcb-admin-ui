import {
	defaultParseSearch,
	type SearchSerializer,
} from "@tanstack/react-router";

/**
 * The router's `stringifySearch`, paired with its unchanged default parser. An array is its key
 * repeated; one element reads back as a plain string, so a list param must accept both; an empty
 * one is the key with no value. docs/url-view-state.md, "In the address bar".
 */

const READABLE: Array<[RegExp, string]> = [
	[/%20/g, "+"],
	[/%3A/gi, ":"],
	[/%2C/gi, ","],
	[/%2F/gi, "/"],
];

const encodePart = (text: string) =>
	READABLE.reduce(
		(encoded, [pattern, raw]) => encoded.replace(pattern, raw),
		encodeURIComponent(text),
	);

const readsBackAs = (text: string): unknown =>
	(defaultParseSearch(`?v=${encodePart(text)}`) as Record<string, unknown>).v;

const scalar = (value: unknown): string => {
	if (typeof value === "string") {
		return readsBackAs(value) === value ? value : JSON.stringify(value);
	}
	if (typeof value === "object" && value !== null) return JSON.stringify(value);
	return String(value);
};

export const stringifySearch: SearchSerializer = (search) => {
	const parts: string[] = [];
	for (const [key, value] of Object.entries(search)) {
		if (value === undefined) continue;
		const name = encodePart(key);
		if (Array.isArray(value)) {
			if (value.length === 0) parts.push(`${name}=`);
			for (const item of value) {
				if (item !== undefined)
					parts.push(`${name}=${encodePart(scalar(item))}`);
			}
		} else {
			parts.push(`${name}=${encodePart(scalar(value))}`);
		}
	}
	return parts.length > 0 ? `?${parts.join("&")}` : "";
};
