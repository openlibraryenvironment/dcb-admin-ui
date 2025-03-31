export const compareVersions = (versionA: string, versionB: string): number => {
	// Extract and clean version strings (removing 'v' prefix if exists)
	const cleanA = versionA.replace(/^v/, "");
	const cleanB = versionB.replace(/^v/, "");

	// Split versions into parts
	const partsA = cleanA.split(".").map((part) => parseInt(part, 10) || 0);
	const partsB = cleanB.split(".").map((part) => parseInt(part, 10) || 0);

	// Ensure both arrays have the same length
	const maxLength = Math.max(partsA.length, partsB.length);
	for (let i = partsA.length; i < maxLength; i++) partsA.push(0);
	for (let i = partsB.length; i < maxLength; i++) partsB.push(0);

	// Compare each part
	for (let i = 0; i < maxLength; i++) {
		if (partsA[i] > partsB[i]) return 1;
		if (partsA[i] < partsB[i]) return -1;
	}

	return 0; // Versions are equal
};

// Helper to determine if a version is less than another
export const isVersionLessThan = (
	currentVersion: string,
	targetVersion: string,
): boolean => {
	try {
		return compareVersions(currentVersion, targetVersion) < 0;
	} catch (error) {
		console.error("Version comparison error:", error);
		return false; // Default to newer behavior if version parsing fails
	}
};
