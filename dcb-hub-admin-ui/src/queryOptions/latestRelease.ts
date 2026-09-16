import { queryOptions } from "@tanstack/react-query";
import axios from "axios";

export type ReleaseRepo = "dcb-service" | "dcb-admin-ui";

export interface LatestRelease {
	tag: string;
	publishedAt: string;
}

const SIX_HOURS = 6 * 60 * 60 * 1000;

export const latestReleaseQueryKey = (repo: ReleaseRepo) =>
	["latestRelease", repo] as const;

export const latestReleaseQuery = (repo: ReleaseRepo) =>
	queryOptions({
		queryKey: latestReleaseQueryKey(repo),
		queryFn: async ({ signal }): Promise<LatestRelease> => {
			const { data } = await axios.get<{
				tag_name: string;
				published_at: string;
			}>(
				`https://api.github.com/repos/openlibraryenvironment/${repo}/releases/latest`,
				{ signal },
			);
			return { tag: data.tag_name, publishedAt: data.published_at };
		},
		// Unauthenticated GitHub allows 60 requests an hour per IP, and a 304
		// revalidation still counts against it - so cache here, and never retry a 403.
		staleTime: SIX_HOURS,
		gcTime: SIX_HOURS,
		retry: false,
		refetchOnWindowFocus: false,
		throwOnError: false,
	});
