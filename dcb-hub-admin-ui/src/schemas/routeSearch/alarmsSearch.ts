import { z } from "@schemas/zod";

// A hand-edited or stale value drops the filter rather than failing the route
export const alarmsSearchSchema = z.object({
	hostLms: z.string().trim().min(1).max(200).optional().catch(undefined),
});
