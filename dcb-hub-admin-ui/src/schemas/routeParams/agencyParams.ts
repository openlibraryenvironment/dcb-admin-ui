import { z } from "@schemas/zod";

// See libraryParams.ts for why .min(1) rather than .uuid().
export const agencyParamsSchema = z.object({
	agencyId: z.string().min(1),
});
