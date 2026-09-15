/** The `git` block of dcb-service's `/info`. gradle-git-properties publishes every leaf as a string. */
export interface ServiceInfoGit {
	build?: { version?: string };
	commit?: { id?: string; time?: string };
	closest?: { tag?: { name?: string; commit?: { count?: string } } };
}

export interface VersionRow {
	id: "dcb-admin-ui" | "dcb-service";
	version: string;
	releasesUrl: string;
	releaseDate?: string;
	commitId?: string;
	commitTime?: string;
	closestTag?: string;
	commitsSinceTag?: number;
	latestVersion: string;
	releaseStatus: string;
	latestReleaseDate?: string;
	latestReleaseUrl?: string;
}
