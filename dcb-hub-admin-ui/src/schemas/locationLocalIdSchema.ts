import i18n from "@/i18n";
import * as Yup from "yup";

/** Koha's library_id is branches.branchcode, at most 10 characters. */
export const KOHA_MAX_BRANCH_CODE_LENGTH = 10;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const required = () =>
	i18n.t("ui.validation.required", { field: i18n.t("locations.local_id") });

/**
 * What a location's localId must be, by the ILS of its Host LMS (`$ils` in the
 * validation context, as `getILS` names it). The server enforces the same rules in
 * `LocationInputValidator`; this says them before the request is sent.
 */
export const locationLocalIdSchema = () =>
	Yup.string()
		.max(64)
		.when("$ils", {
			is: "FOLIO",
			then: (schema) =>
				schema
					.required(required())
					.matches(UUID, i18n.t("ui.validation.locations.local_id_folio")),
		})
		.when("$ils", {
			is: "Polaris",
			then: (schema) =>
				schema
					.required(required())
					.matches(/^\d+$/, i18n.t("ui.validation.locations.local_id_polaris"))
					.test(
						"non-negative",
						i18n.t("ui.validation.locations.local_id_polaris"),
						(val) => !val || parseInt(val) >= 0,
					),
		})
		.when("$ils", {
			is: "Sierra",
			then: (schema) =>
				schema
					.nullable()
					.optional()
					.test(
						"non-negative-if-provided",
						i18n.t("ui.validation.locations.local_id_sierra"),
						(val) => !val || (/^\d+$/.test(val) && parseInt(val) >= 0),
					),
		})
		.when("$ils", {
			is: "Koha",
			then: (schema) =>
				schema
					.required(required())
					.max(
						KOHA_MAX_BRANCH_CODE_LENGTH,
						i18n.t("ui.validation.locations.local_id_koha"),
					),
		});
