// Is version equal or greater than the targetVersion
export const determineAcceptableVersion = (
	version: string | null,
	targetVersion: string,
) => {
	if (version) {
		const numericVersion = version.substring(1); // takes the v out of version so we can get major, minor
		const [major, minor] = numericVersion.split(".").map(Number);
		const [targetMajor, targetMinor] = targetVersion.split(".").map(Number);
		return (
			major > targetMajor || (major == targetMajor && minor >= targetMinor)
		);
	} else {
		// If dev, this is acceptable (as dev won't have a standard version, but will always be ahead of release.)
		return true;
	}
};
