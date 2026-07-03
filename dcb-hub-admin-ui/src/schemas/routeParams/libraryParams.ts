import { z } from "zod";

// .min(1) rather than .uuid(): schema.graphqls only declares `id: ID!`
// (opaque GraphQL ID), not confirmed to always be a UUID - a stricter check
// risks false-positive not-found errors on otherwise-valid IDs.
export const libraryParamsSchema = z.object({
	libraryId: z.string().min(1),
});
