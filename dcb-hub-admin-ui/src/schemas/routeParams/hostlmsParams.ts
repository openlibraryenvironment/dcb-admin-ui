import { z } from "zod";

// See libraryParams.ts for why .min(1) rather than .uuid().
export const hostlmsParamsSchema = z.object({
	hostlmsId: z.string().min(1),
});
