import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { GridColDef } from "@mui/x-data-grid-premium";
import { Location } from "@models/Location";
import { Library } from "@models/Library";
import { PatronRequest } from "@models/PatronRequest";
import {
	patronRequestColumnsNoStatusFilter,
	standardPatronRequestColumns,
} from "@columns/getPatronRequestColumns";
import { isOnly } from "@filters/isOnly";
import { getDcbWorkflowOptions } from "@constants/workflows/DCBWorkflows";
import { PICKUP_LIBRARY_DELIMITER } from "@helpers/dataGrid/buildFilterQuery";

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

	// Pickup library is not a PatronRequest field - a request only knows its
	// pickup location id. So a library IS its set of pickup locations here: the
	// option's value packs those ids, which buildFilterQuery expands into an OR
	// over pickupLocationCode, and which pickupLibraryTokenByLocationId maps a
	// row back onto so the cell renders the library's name.
	const { pickupLibraryOptions, pickupLibraryTokenByLocationId } =
		useMemo(() => {
			const locationIdsByAgency = new Map<string, string[]>();
			for (const location of locations) {
				const agencyCode = location?.agency?.code;
				if (!agencyCode || !location?.id) continue;
				const ids = locationIdsByAgency.get(agencyCode) ?? [];
				ids.push(location.id);
				locationIdsByAgency.set(agencyCode, ids);
			}

			const options: Array<{ value: string; label: string }> = [];
			const tokenByLocationId = new Map<string, string>();

			for (const library of libraries) {
				const ids = locationIdsByAgency.get(library?.agencyCode);
				// A library with no pickup locations cannot be pickup-filtered, so
				// offering it would only ever return nothing.
				if (!ids || ids.length === 0) continue;
				const token = ids.join(PICKUP_LIBRARY_DELIMITER);
				options.push({ value: token, label: library.fullName });
				for (const id of ids) tokenByLocationId.set(id, token);
			}

			return {
				pickupLibraryOptions: options,
				pickupLibraryTokenByLocationId: tokenByLocationId,
			};
		}, [locations, libraries]);

	const workflowOptions = useMemo(() => getDcbWorkflowOptions(t), [t]);

	const baseColumns =
		variant === "noStatus"
			? patronRequestColumnsNoStatusFilter
			: standardPatronRequestColumns;

	const columns = useMemo(() => {
		return baseColumns.map((col) => {
			if (col.field === "pickupLocationCode") {
				return {
					...col,
					headerName: t("patron_requests.pickup_location_name"),
					valueOptions: locationOptions,
					type: "singleSelect",
					filterOperators: isOnly,
				} as GridColDef;
			}

			if (col.field === "pickupLibrary") {
				return {
					...col,
					valueOptions: pickupLibraryOptions,
					type: "singleSelect",
					filterOperators: isOnly,
					// Resolve to the option's own value so MUI (and the export's label
					// map) render the library name from valueOptions.
					valueGetter: (_value: any, row: PatronRequest) =>
						pickupLibraryTokenByLocationId.get(row?.pickupLocationCode) ?? "",
				} as GridColDef;
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

			if (col.field === "activeWorkflow") {
				return {
					...col,
					valueOptions: workflowOptions,
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
		pickupLibraryOptions,
		pickupLibraryTokenByLocationId,
		workflowOptions,
		t,
	]);

	return columns;
};
