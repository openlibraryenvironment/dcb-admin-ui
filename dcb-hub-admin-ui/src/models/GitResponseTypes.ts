export interface GitResponseObject {
	tags: string;
	dirty: boolean;
	build: object; // Specify further if we end up using the build info
	commit: object; // As above - this is info about last commit which we are unlikely to expose, hence leaving it generic
	remote: object; // Similar to above - info about the remote which we do not want to expose
	branch: string;
	name: string;
	closest: GitClosest;
}

export interface GitClosest {
	tag: GitTagObject;
}
export interface GitTagObject {
	name: string;
	commit: object;
}
export interface InfoEndpointResponse {
	git: GitResponseObject;
	name: string;
	tag_name?: string;
}
