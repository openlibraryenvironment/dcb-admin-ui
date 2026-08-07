import i18n from "@/i18n";
import { z } from "zod";

// Build out, ensure validation applies everywhere
export const newLibrarySchema = z.object({
	hostLmsCode: z.string().min(
		1,
		i18n.t("ui.validation.required", {
			field: i18n.t("hostlms.code"),
		}),
	),
	hostLmsName: z.string().min(
		1,
		i18n.t("ui.validation.required", {
			field: i18n.t("hostlms.name"),
		}),
	),
	lmsClientClass: z.string().min(
		1,
		i18n.t("ui.validation.required", {
			field: i18n.t("libraries.service.systems.ils"),
		}),
	),
	clientConfig: z
		.string()
		.optional()
		.refine(
			(val) => {
				if (!val) return true;
				try {
					JSON.parse(val);
					return true;
				} catch {
					return false;
				}
			},
			{ message: i18n.t("libraries.new.invalid_json_client_config") },
		),
	suppressionRulesetName: z.string().optional(),
	itemSuppressionRulesetName: z.string().optional(),
	agencyCode: z.string().min(
		1,
		i18n.t("ui.validation.required", {
			field: i18n.t("libraries.new.agency"),
		}),
	),
	fullName: z.string().min(
		1,
		i18n.t("ui.validation.required", {
			field: i18n.t("libraries.name"),
		}),
	),
	// The four below are `String!` in LibraryInput. They were optional here, so
	// the wizard sent "" and GraphQL's non-null check passed on an empty string -
	// the `!` protected nothing and the user was never asked.
	shortName: z.string().min(
		1,
		i18n.t("ui.validation.required", {
			field: i18n.t("libraries.short_name"),
		}),
	),
	abbreviatedName: z.string().min(
		1,
		i18n.t("ui.validation.required", {
			field: i18n.t("libraries.abbreviated_name"),
		}),
	),
	address: z.string().min(
		1,
		i18n.t("ui.validation.required", {
			field: i18n.t("libraries.primaryLocation.address"),
		}),
	),
	type: z.string().min(
		1,
		i18n.t("ui.validation.required", {
			field: i18n.t("libraries.type"),
		}),
	),
	// Nullable in LibraryInput, but a library with no coordinates cannot be
	// placed on a map or used for distance-based supplier selection.
	latitude: z.number({
		error: i18n.t("ui.validation.required", {
			field: i18n.t("libraries.primaryLocation.latitude"),
		}),
	}),
	longitude: z.number({
		error: i18n.t("ui.validation.required", {
			field: i18n.t("libraries.primaryLocation.longitude"),
		}),
	}),
	supportHours: z.string().optional(),
	patronWebsite: z.string().optional(),
	authProfile: z.string().min(
		1,
		i18n.t("ui.validation.required", {
			field: i18n.t("libraries.config.patronAuth.auth_profile"),
		}),
	),
	hostLmsConfiguration: z.string().optional(),
	discoverySystem: z.string().optional(),
	backupDowntimeSchedule: z.string().optional(),
	// Marked required in the UI and recorded in the data change log, so validate
	// it rather than letting an empty reason through.
	reason: z.string().min(
		1,
		i18n.t("ui.validation.required", {
			field: i18n.t("data_change_log.reason"),
		}),
	),
	// Was rendered on the profile step but absent from both this schema and the
	// mutation payload, so whatever the user typed was silently discarded.
	changeReferenceUrl: z.string().optional(),
	libraryId: z.string().optional(),
	contacts: z
		.array(
			z.object({
				firstName: z.string().min(
					1,
					i18n.t("ui.validation.required", {
						field: i18n.t("libraries.contacts.first_name"),
					}),
				),
				lastName: z.string().min(
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
		.min(1, i18n.t("libraries.contacts.minimum")),
	groupId: z.string().optional(),
});
