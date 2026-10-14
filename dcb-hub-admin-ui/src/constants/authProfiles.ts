import { HOST_LMS_CLASSES } from "@helpers/hostLmsClientConfig";

export interface AuthProfileOption {
	value: string;
	labelKey: string;
}

const BARCODE_PIN = {
	value: "BASIC/BARCODE+PIN",
	labelKey: "libraries.config.patronAuth.profiles.barcode_pin",
};
const BARCODE_PASSWORD = {
	value: "BASIC/BARCODE+PASSWORD",
	labelKey: "libraries.config.patronAuth.profiles.barcode_password",
};
const BARCODE_NAME = {
	value: "BASIC/BARCODE+NAME",
	labelKey: "libraries.config.patronAuth.profiles.barcode_name",
};
const UNIQUE_ID_PIN = {
	value: "BASIC/UNIQUE-ID+PIN",
	labelKey: "libraries.config.patronAuth.profiles.unique_id_pin",
};
const UNIQUE_ID_NAME = {
	value: "BASIC/UNIQUE-ID+NAME",
	labelKey: "libraries.config.patronAuth.profiles.unique_id_name",
};

/**
 * The profiles each adapter's patronAuth accepts in dcb-service: SierraLmsClient and
 * PolarisLmsClient AUTH_PROFILES, AlmaHostLmsClient PASSWORD_ and PIN_AUTH_PROFILE,
 * ConsortialFolioClientConstants.AUTH_PROFILE_BASIC_BARCODE_PIN. Anything else is refused
 * as UnsupportedAuthProfileException. The first is the default.
 */
const AUTH_PROFILES_BY_ILS: Record<string, readonly AuthProfileOption[]> = {
	[HOST_LMS_CLASSES.sierra]: [
		BARCODE_PIN,
		BARCODE_NAME,
		UNIQUE_ID_PIN,
		UNIQUE_ID_NAME,
	],
	[HOST_LMS_CLASSES.polaris]: [BARCODE_PIN, BARCODE_PASSWORD],
	[HOST_LMS_CLASSES.alma]: [BARCODE_PASSWORD, BARCODE_PIN],
	[HOST_LMS_CLASSES.folio]: [BARCODE_PIN],
};

/** KohaHostLmsClient ignores the profile: Koha checks a cardnumber and password. */
const FIXED_AUTH_PROFILE: Record<string, string> = {
	[HOST_LMS_CLASSES.koha]: BARCODE_PASSWORD.value,
};

/** The choices for this ILS, or undefined where the profile is free text or fixed. */
export const authProfileOptions = (
	lmsClientClass: string | undefined | null,
): readonly AuthProfileOption[] | undefined =>
	lmsClientClass ? AUTH_PROFILES_BY_ILS[lmsClientClass] : undefined;

export const isAuthProfileFixed = (
	lmsClientClass: string | undefined | null,
): boolean => !!lmsClientClass && lmsClientClass in FIXED_AUTH_PROFILE;

/** What is sent: the choice, else the ILS's fixed value or default. */
export const resolveAuthProfile = (
	lmsClientClass: string | undefined | null,
	chosen: string | undefined | null,
): string => {
	if (lmsClientClass && FIXED_AUTH_PROFILE[lmsClientClass]) {
		return FIXED_AUTH_PROFILE[lmsClientClass];
	}

	return chosen || authProfileOptions(lmsClientClass)?.[0]?.value || "";
};

/** A chosen profile the ILS will refuse. Blank is not one: it resolves to the default. */
export const isUnsupportedAuthProfile = (
	lmsClientClass: string | undefined | null,
	chosen: string | undefined | null,
): boolean => {
	const options = authProfileOptions(lmsClientClass);

	return (
		!!options && !!chosen && !options.some((option) => option.value === chosen)
	);
};
