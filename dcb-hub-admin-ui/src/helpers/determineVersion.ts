// Is version equal or greater than the targetVersion
export const determineAcceptableVersion = (
	version: string | null,
	targetVersion: string,
) => {
	console.log(version);
	if (version) {
		const numericVersion = version.substring(1); // takes the v out of version so we can get major, minor
		const [major, minor] = numericVersion.split(".").map(Number);
		const [targetMajor, targetMinor] = targetVersion.split(".").map(Number);
		return (
			major > targetMajor || (major == targetMajor && minor >= targetMinor)
		);
	} else {
		// If no specified version, fall back
		return false;
	}
};
