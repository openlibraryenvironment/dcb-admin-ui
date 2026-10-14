import {
	canonicalItemTypes,
	canonicalPatronTypes,
} from "@constants/mappingsImportConstants";
import type { CreateReferenceValueMappingInput } from "@generated/graphql";

/**
 * One mapping from every DCB type to a single local value: the shape most sites need,
 * written as the rows a mapping file would hold. DCB maps from its own type to the
 * library's when it creates a virtual patron or a virtual item there.
 */
export const mapAllTypes = (
	hostLmsCode: string,
	localPatronType: string,
	localItemType: string,
): CreateReferenceValueMappingInput[] => {
	const rows = (
		category: "patronType" | "ItemType",
		canonical: readonly string[],
		local: string,
	) =>
		local.trim() === ""
			? []
			: canonical.map((fromValue) => ({
					fromContext: "DCB",
					fromCategory: category,
					fromValue,
					toContext: hostLmsCode,
					toCategory: category,
					toValue: local.trim(),
				}));

	return [
		...rows("patronType", canonicalPatronTypes, localPatronType),
		...rows("ItemType", canonicalItemTypes, localItemType),
	];
};
