export interface Tag {
	name: string;
	commit: {
		sha: string;
		url: string;
	};
	zipball_url: string;
	tarball_url: string;
	node_id: string;
}

export interface ServiceInfo {
	app: {
		name: string;
		version: string;
	};
	[key: string]: any;
}

export interface Release {
	url: string;
	html_url: string;
	id: number;
	tag_name: string;
	name: string;
	draft: boolean;
	prerelease: boolean;
	created_at: string;
	published_at: string;
	body: string;
	author: {
		login: string;
		id: number;
		avatar_url: string;
		url: string;
	};
	[key: string]: any;
}

export interface VersionData {
	id: number;
	repository: string;
	latestVersion: string;
	currentVersion: string;
	status: "current" | "outdated" | "loading" | "error";
	latestData?: Tag | Release | ServiceInfo;
	currentData?: any;
	detailType: "tag" | "release" | "serviceInfo";
}
