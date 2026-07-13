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
	shortName: z.string().optional(),
	abbreviatedName: z.string().optional(),
	address: z.string().optional(),
	type: z.string().optional(),
	latitude: z.number(),
	longitude: z.number(),
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
	reason: z.string().optional(),
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
