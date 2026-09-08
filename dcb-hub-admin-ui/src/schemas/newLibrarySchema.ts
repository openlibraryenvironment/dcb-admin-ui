import i18n from "@/i18n";
import { z } from "zod";
import {
	buildClientConfig,
	getHostLmsProfile,
	hasSharedSystemConflict,
	missingRequiredClientConfig,
} from "@helpers/hostLmsClientConfig";

/**
 * Coordinates are typed as text, not as numbers.
 *
 * The field is a text input, so its value is a string - modelling it as a
 * number meant the change handler had to call `Number()` on every keystroke,
 * and a pasted "51.5o74" became NaN. NaN is a number, so it sailed through
 * validation, rendered back into the input as the literal text "NaN", and left
 * the field impossible to correct by typing. Keep the string, validate the
 * string, convert once at the mutation boundary.
 */
const coordinate = (fieldLabel: string, limit: number) =>
	z
		.string()
		.trim()
		.min(1, i18n.t("ui.validation.required", { field: fieldLabel }))
		.refine((value) => Number.isFinite(Number(value)), {
			message: i18n.t("ui.validation.not_a_number", { field: fieldLabel }),
		})
		.refine(
			(value) => {
				const parsed = Number(value);
				return !Number.isFinite(parsed) || Math.abs(parsed) <= limit;
			},
			{
				message: i18n.t("ui.validation.out_of_range", {
					field: fieldLabel,
					min: -limit,
					max: limit,
				}),
			},
		);

export const newLibrarySchema = z
	.object({
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
		/**
		 * Whether this run of the wizard is creating a Host LMS or attaching the
		 * library to one that already exists. Everything below about client
		 * config only applies to the first case: an existing Koha system is a
		 * perfectly valid thing to attach a library to, even though dcb-service
		 * cannot yet create one.
		 */
		isCreatingHostLms: z.boolean(),
		/**
		 * "guided" builds the client config from the per-ILS fields below;
		 * "json" hands the raw editor to power users. The two are never merged -
		 * whichever the user is in is the one that is sent.
		 */
		clientConfigMode: z.enum(["guided", "json"]),
		/**
		 * The guided form's values, shaped exactly like the client config object
		 * itself (including Polaris' nested papi/services/item), so building the
		 * payload is a type coercion rather than a translation.
		 */
		clientConfigFields: z.record(z.string(), z.unknown()).optional(),
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
		latitude: coordinate(i18n.t("libraries.primaryLocation.latitude"), 90),
		longitude: coordinate(i18n.t("libraries.primaryLocation.longitude"), 180),
		/**
		 * Whether the library participates in each direction from the moment it
		 * is created. Both were only settable afterwards, on the library settings
		 * page, so every library started with `null` - which is "nobody has said"
		 * rather than "yes", and reads as a dormant library on the onboarding
		 * grid until somebody goes back and answers it.
		 */
		isBorrowingAgency: z.boolean(),
		isSupplyingAgency: z.boolean(),
		/**
		 * Text, like the coordinates and for the same reason: a number input's
		 * value is a string, and coercing on every keystroke turns a mistyped
		 * character into NaN. Empty means no cap.
		 */
		maxConsortialLoans: z
			.string()
			.trim()
			.refine(
				(value) =>
					value === "" ||
					(Number.isInteger(Number(value)) && Number(value) >= 0),
				{
					message: i18n.t("ui.validation.non_negative_integer", {
						field: i18n.t("libraries.max_consortial_loans"),
					}),
				},
			)
			.optional(),
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
					/**
					 * Present only on contacts that came from an existing library when
					 * resuming. It is what distinguishes a contact already stored from
					 * one the user has just typed in, and therefore which of them the
					 * resume path has to create.
					 */
					id: z.string().optional(),
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
	})
	/**
	 * Client config is only checkable once the ILS is known, so it has to happen
	 * here rather than on the field. dcb-service's HostLmsConfigValidator rejects
	 * a config missing any of these with a 400; asking for them up front is the
	 * same contract stated before the round trip instead of after it.
	 */
	.superRefine((values, ctx) => {
		// Attaching to an existing Host LMS neither sends a client config nor is
		// constrained by what dcb-service can create.
		if (!values.isCreatingHostLms) return;

		// A class with no profile is one HostLmsConfigValidator has no case for,
		// and it answers "Unsupported LMS Client Class" with a 400. This used to
		// return early, which let an unknown class through to be rejected by the
		// server instead of by the form.
		const profile = getHostLmsProfile(values.lmsClientClass);
		if (!profile) {
			ctx.addIssue({
				code: "custom",
				path: ["lmsClientClass"],
				message: i18n.t("hostlms.unsupported_for_creation", {
					ils: values.lmsClientClass,
				}),
			});
			return;
		}

		if (values.clientConfigMode === "json") {
			// The JSON itself is already parse-checked on the field; here we only
			// hold the raw editor to the same required-key contract as the form.
			let parsed: Record<string, unknown> = {};
			try {
				parsed = values.clientConfig ? JSON.parse(values.clientConfig) : {};
			} catch {
				return; // The field-level refine has already reported this.
			}
			const missing = missingRequiredClientConfig(
				values.lmsClientClass,
				parsed,
			);
			if (missing.length > 0) {
				ctx.addIssue({
					code: "custom",
					path: ["clientConfig"],
					message: i18n.t("hostlms.config_fields.missing_required", {
						fields: missing
							.map((problem) => i18n.t(problem.labelKey))
							.join(", "),
					}),
				});
			}
			if (hasSharedSystemConflict(values.lmsClientClass, parsed)) {
				ctx.addIssue({
					code: "custom",
					path: ["clientConfig"],
					message: i18n.t("hostlms.config_fields.shared_system_conflict"),
				});
			}
			return;
		}

		for (const problem of missingRequiredClientConfig(
			values.lmsClientClass,
			values.clientConfigFields ?? {},
		)) {
			ctx.addIssue({
				code: "custom",
				path: ["clientConfigFields", ...problem.name.split(".")],
				message: i18n.t("ui.validation.required", {
					field: i18n.t(problem.labelKey),
				}),
			});
		}

		// Reported against default-agency-code rather than shared-system: the flag is
		// the deliberate statement about the system, and the agency code is the value
		// that has to go.
		if (
			hasSharedSystemConflict(
				values.lmsClientClass,
				values.clientConfigFields ?? {},
			)
		) {
			ctx.addIssue({
				code: "custom",
				path: ["clientConfigFields", "default-agency-code"],
				message: i18n.t("hostlms.config_fields.shared_system_conflict"),
			});
		}
	});

export type NewLibraryFormValues = z.infer<typeof newLibrarySchema>;

/**
 * The client config to send, whichever editor the user was in. Kept beside the
 * schema so the "which mode wins" rule is written once.
 */
export const resolveClientConfig = (
	values: Pick<
		NewLibraryFormValues,
		| "clientConfigMode"
		| "clientConfigFields"
		| "clientConfig"
		| "lmsClientClass"
	>,
): Record<string, unknown> => {
	if (values.clientConfigMode === "json") {
		try {
			return values.clientConfig ? JSON.parse(values.clientConfig) : {};
		} catch {
			return {};
		}
	}
	return buildClientConfig(
		values.lmsClientClass,
		values.clientConfigFields ?? {},
	);
};
