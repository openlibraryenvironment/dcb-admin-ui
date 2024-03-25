/**
 * Converts a hex value into either an RGB or a RGBA value.
 * This should make our lives easier when checking colour values in Cypress, which only accepts rgb values.
 *
 * To get an RGBA value, you must supply a valid alpha value.
 *
 * @param string The hex value you'd like to convert. ('423456'. '#423456', ''424', '#424')
 * @param number An alpha value. (optional) ('0.2', '0.5')
 * @return An rgb or rgba value. ('rgb(26, 42, 33)'. 'rgba(26, 43, 44, 0.5)')
 */

export default function hexToRgb(hex: string, alpha?: number): string | null {
	// First, remove the hash
	hex = hex.replace("#", "");

	// Next, check if the hex value is valid
	// TODO: replace or simplify over-complicated regex
	if (!/^[A-Fa-f0-9]{6}$/i.test(hex)) {
		return null;
	}

	// Now we need to parse the hex value into RGB components
	const hexInt = parseInt(hex, 16); // This holds the integer value of the hex code.
	// We can then use mathematical operations to get what we want
	const r = (hexInt >> 16) & 255; // right shift by 16 bits for the red
	const g = (hexInt >> 8) & 255; // right shift again (8 bits) to get the green
	const b = hexInt & 255; // mask the lowest 8 bits to get the blue

	// If alpha value is provided, return RGBA
	if (typeof alpha === "number") {
		if (alpha < 0 || alpha > 1) {
			throw new Error("Invalid alpha value. Alpha must be between 0 and 1.");
		}
		// Else the alpha is valid, so add it
		return `rgba(${r}, ${g}, ${b}, ${alpha})`;
	}

	// Otherwise, return RGB
	return `rgb(${r}, ${g}, ${b})`;
}
