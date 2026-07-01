import { z } from "zod";

// Build this out, ensure i18n
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
