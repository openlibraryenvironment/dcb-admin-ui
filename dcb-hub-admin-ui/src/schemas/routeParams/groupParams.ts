import { z } from "zod";

// See libraryParams.ts for why .min(1) rather than .uuid().
export const groupParamsSchema = z.object({
	groupId: z.string().min(1),
});
