import { z } from "zod";

// Build this out, ensure i18n
//
// Only hostLmsCode/hostLmsName/lmsClientClass/clientConfig/contacts carry
// real validation rules - see NewLibrary.tsx's STEP_SCHEMA_FIELDS, which
// scopes handleNext's trigger() calls to just those. The remaining fields
// below (Profile/RefMappings/NumMappings/Locations steps, plus the
// libraryId set programmatically after library creation) are declared
// as .optional() purely so the schema's inferred type covers every field
// useForm's defaultValues/setValue actually touch - they were never
// validated before this file's zod version was pinned to v3 either, this
// just keeps that same (lack of) behavior type-safe.
export const newLibrarySchema = z.object({
	hostLmsCode: z.string().min(1, "Host LMS Code is required"),
	hostLmsName: z.string().min(1, "Host LMS Name is required"),
	lmsClientClass: z.string().min(1, "Client class is required"),
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
			{ message: "Invalid JSON in client config" },
		),
	suppressionRulesetName: z.string().optional(),
	itemSuppressionRulesetName: z.string().optional(),
	agencyCode: z.string().optional(),
	fullName: z.string().optional(),
	shortName: z.string().optional(),
	abbreviatedName: z.string().optional(),
	address: z.string().optional(),
	type: z.string().optional(),
	latitude: z.number().nullable().optional(),
	longitude: z.number().nullable().optional(),
	supportHours: z.string().optional(),
	patronWebsite: z.string().optional(),
	hostLmsConfiguration: z.string().optional(),
	discoverySystem: z.string().optional(),
	backupDowntimeSchedule: z.string().optional(),
	reason: z.string().optional(),
	libraryId: z.string().optional(),
	contacts: z
		.array(
			z.object({
				firstName: z.string().min(1, "First name is required"),
				lastName: z.string().min(1, "Last name is required"),
				email: z.string().email("Invalid email format"),
				role: z.string().min(1, "Role is required"),
				isPrimaryContact: z.boolean(),
			}),
		)
		.min(1, "At least one contact is required"),
	groupId: z.string().optional(),
});
