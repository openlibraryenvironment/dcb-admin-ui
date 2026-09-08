import i18n from "@/i18n";
import { z } from "zod";

/**
 * A consortium cannot exist without a library group of type "Consortium" -
 * CreateConsortiumDataFetcher looks one up by name and refuses outright if it
 * is not there. The group name and code are therefore part of this form rather
 * than a separate errand the user is expected to have run first.
 */
export const newConsortiumSchema = z.object({
	name: z
		.string()
		.trim()
		.min(
			1,
			i18n.t("ui.validation.required", { field: i18n.t("consortium.name") }),
		)
		.max(200),
	displayName: z
		.string()
		.trim()
		.min(
			1,
			i18n.t("ui.validation.required", {
				field: i18n.t("consortium.display_name"),
			}),
		)
		.max(200),
	// LibraryGroupInput caps these; NewGroup enforces the same numbers.
	groupName: z
		.string()
		.trim()
		.min(1, i18n.t("ui.validation.required", { field: i18n.t("groups.name") }))
		.max(32, i18n.t("groups.name_max")),
	groupCode: z
		.string()
		.trim()
		.min(1, i18n.t("ui.validation.required", { field: i18n.t("groups.code") }))
		.max(5, i18n.t("groups.code_max")),
	// Parsed server-side with ISO_LOCAL_DATE, so anything else is a 500 waiting
	// to happen.
	dateOfLaunch: z
		.string()
		.trim()
		.regex(/^\d{4}-\d{2}-\d{2}$/, i18n.t("consortium.date_of_launch_format")),
	websiteUrl: z.string().trim().max(200).optional(),
	catalogueSearchUrl: z.string().trim().max(200).optional(),
	description: z.string().trim().max(400).optional(),
	reason: z
		.string()
		.trim()
		.min(
			1,
			i18n.t("ui.validation.required", {
				field: i18n.t("data_change_log.reason"),
			}),
		),
	changeReferenceUrl: z.string().trim().optional(),
	/**
	 * Which consortium-wide functional settings to switch on, keyed by the
	 * schema enum name. A record rather than a list because the set of settings
	 * offered is fixed - see CONSORTIUM_FUNCTIONAL_SETTINGS - so the only thing
	 * that varies is the answer to each one.
	 */
	functionalSettings: z.record(z.string(), z.boolean()),
	/**
	 * The data fetcher iterates `contacts` without a null check, so the field is
	 * never optional on the wire. Requiring a real one is also the right answer:
	 * a consortium with nobody to contact is not set up.
	 */
	contacts: z
		.array(
			z.object({
				firstName: z
					.string()
					.trim()
					.min(
						1,
						i18n.t("ui.validation.required", {
							field: i18n.t("libraries.contacts.first_name"),
						}),
					),
				lastName: z
					.string()
					.trim()
					.min(
						1,
						i18n.t("ui.validation.required", {
							field: i18n.t("libraries.contacts.last_name"),
						}),
					),
				email: z.email(i18n.t("ui.data_grid.validation.email")),
				role: z.string().min(
					1,
					i18n.t("ui.validation.required", {
						field: i18n.t("libraries.contacts.role"),
					}),
				),
				isPrimaryContact: z.boolean(),
			}),
		)
		.min(1, i18n.t("consortium.contacts.minimum")),
});

export type NewConsortiumFormValues = z.infer<typeof newConsortiumSchema>;
