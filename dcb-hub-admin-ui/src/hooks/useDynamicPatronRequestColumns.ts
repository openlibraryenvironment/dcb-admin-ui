import { useMemo } from "react";
import { useTranslation } from "next-i18next";
import { GridColDef } from "@mui/x-data-grid-premium";
import { Location } from "@models/Location";
import { Library } from "@models/Library";
import {
	standardPatronRequestColumns,
	patronRequestColumnsNoStatusFilter,
} from "src/helpers/DataGrid/columns";
import { isOnly } from "src/helpers/DataGrid/filters";
// A hook for injecting the dynamic columns
// These are columns where we fetch the values to provide options for filtering (i.e. actual library names)

interface UsePatronRequestColumnsProps {
	locations?: Location[];
	libraries?: Library[];
	variant?: "standard" | "noStatus"; // May not be necessary
}

export const useDynamicPatronRequestColumns = ({
	locations = [],
	libraries = [],
	variant = "standard",
}: UsePatronRequestColumnsProps) => {
	const { t } = useTranslation();
	const libraryFilterOptions = useMemo(() => {
		if (!libraries) return [];
		return libraries.map((lib: Library) => ({
			value: lib.agencyCode,
			label: lib.fullName,
		}));
	}, [libraries]);

	const patronLibraryFilterOptions = useMemo(() => {
		if (!libraries) return [];
		return libraries.map((lib: Library) => ({
			value: lib.agency?.hostLms?.code,
			label: lib.fullName,
		}));
	}, [libraries]);

	const locationOptions = useMemo(() => {
		if (!locations) return [];
		return locations.map((loc: Location) => ({
			value: loc?.id,
			label: loc?.name,
		}));
	}, [locations]);

	const baseColumns =
		variant === "noStatus"
			? patronRequestColumnsNoStatusFilter
			: standardPatronRequestColumns;

	const columns = useMemo(() => {
		return baseColumns.map((col) => {
			if (col.field === "pickupLocationCode") {
				if (col.field === "pickupLocationCode") {
					return {
						...col,
						headerName: t("patron_requests.pickup_location_name"),
						valueOptions: locationOptions,
						type: "singleSelect",
						filterOperators: isOnly,
					} as GridColDef;
				}
			}

			if (col.field === "supplyingAgencyCode") {
				return {
					...col,
					valueOptions: libraryFilterOptions,
					// Ensure type is singleSelect so the dropdown appears
					type: "singleSelect",
				} as GridColDef;
			}

			if (col.field === "patronHostlmsCode") {
				return {
					...col,
					valueOptions: patronLibraryFilterOptions,
					type: "singleSelect",
				} as GridColDef;
			}

			return col;
		});
	}, [
		baseColumns,
		libraryFilterOptions,
		locationOptions,
		patronLibraryFilterOptions,
		t,
	]);

	return columns;
};
