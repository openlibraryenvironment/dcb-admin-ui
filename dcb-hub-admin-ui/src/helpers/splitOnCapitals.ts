export function splitOnCapitals(value: string): string[] {
	const lowerCaseValue = value.toLowerCase();
	let result = "";

	for (let i = 0; i < value.length; i++) {
		if (value[i] !== lowerCaseValue[i]) {
			result += " " + value[i];
		} else {
			result += lowerCaseValue[i];
		}
	}

	return result.trim().split(" ");
}
