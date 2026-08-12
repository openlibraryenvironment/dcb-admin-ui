import type { DefaultValues } from "react-hook-form";
import type { NewLibraryFormValues } from "@schemas/newLibrarySchema";
import type { HostLmsVerificationResult } from "@helpers/hostLmsVerification";
import type {
	CreateLibraryContactInput,
	LibraryInput,
	UpdateAgencyInput,
	UpdateLibraryInput,
} from "@generated/graphql";

/**
 * What the New Library wizard sends, and when it is allowed to send it.
 *
 * This lived inside the 900-line dialog, which is how it came to send the
 * `LibraryInput` shape at `updateLibrary` - a different type, with a different
 * and much smaller set of fields - and fail every save on the "finish setup"
 * path. Each builder is now declared `satisfies` its generated input type, so
 * an undeclared field is a compile error rather than a server rejection nobody
 * sees until a library is half-configured.
 *
 * The guards are here for the same reason: "has this step already written to
 * the server" is a rule about the data, not about the rendering, and while it
 * was only a comment in the component the wizard cheerfully re-ran createHostLms
 * and createLibrary whenever the user pressed Back and then Next.
 */

/**
 * RHF's DefaultValues is a deep-partial, which is what lets fields start out
 * unset even though the schema requires them - the profile step then reports
 * them as missing, which is the whole point.
 */
export type LibraryFormDefaults = DefaultValues<NewLibraryFormValues>;

export const EMPTY_CONTACT = {
	firstName: "",
	lastName: "",
	email: "",
	role: "",
	isPrimaryContact: false,
};

export const EMPTY_LIBRARY_FORM: LibraryFormDefaults = {
	// Host LMS Fields
	hostLmsCode: "",
	hostLmsName: "",
	lmsClientClass: "",
	// Flipped when the user chooses "create new system"; see the schema.
	isCreatingHostLms: false,
	clientConfigMode: "guided",
	clientConfigFields: {},
	clientConfig: "",
	suppressionRulesetName: "",
	itemSuppressionRulesetName: "",
	// Library Fields
	agencyCode: "",
	fullName: "",
	shortName: "",
	abbreviatedName: "",
	address: "",
	type: "",
	latitude: "",
	longitude: "",
	// A library is added to take part; opting out is the deliberate choice.
	isBorrowingAgency: true,
	isSupplyingAgency: true,
	maxConsortialLoans: "",
	supportHours: "",
	patronWebsite: "",
	hostLmsConfiguration: "",
	discoverySystem: "",
	backupDowntimeSchedule: "",
	authProfile: "",
	reason: "Adding a new library",
	changeReferenceUrl: "",
	libraryId: "",
	contacts: [{ ...EMPTY_CONTACT }],
	groupId: "",
};

/**
 * Prefills the wizard from a library that already exists. Absent values become
 * "" rather than null so react-hook-form treats the inputs as controlled and
 * the newly-required fields show as empty and invalid, which is the point:
 * those are the ones the user has come back to fill in.
 */
export const formValuesFromLibrary = (library: any): LibraryFormDefaults => {
	const contacts = (library?.contacts ?? []).map((contact: any) => ({
		// Kept so the resume path can tell a stored contact from a newly typed
		// one and only create the latter.
		id: contact.id ?? undefined,
		firstName: contact.firstName ?? "",
		lastName: contact.lastName ?? "",
		email: contact.email ?? "",
		role: contact.role?.name ?? contact.role ?? "",
		isPrimaryContact: contact.isPrimaryContact ?? false,
	}));

	return {
		...EMPTY_LIBRARY_FORM,
		hostLmsCode: library?.agency?.hostLms?.code ?? "",
		hostLmsName: library?.agency?.hostLms?.name ?? "",
		lmsClientClass: library?.agency?.hostLms?.lmsClientClass ?? "",
		agencyCode: library?.agencyCode ?? "",
		fullName: library?.fullName ?? "",
		shortName: library?.shortName ?? "",
		abbreviatedName: library?.abbreviatedName ?? "",
		address: library?.address ?? "",
		type: library?.type ?? "",
		latitude: library?.latitude == null ? "" : String(library.latitude),
		longitude: library?.longitude == null ? "" : String(library.longitude),
		// Only an explicit `false` is "switched off"; an unanswered library is
		// resumed as participating, which is what it is being finished to do.
		isBorrowingAgency: library?.agency?.isBorrowingAgency !== false,
		isSupplyingAgency: library?.agency?.isSupplyingAgency !== false,
		maxConsortialLoans:
			library?.agency?.maxConsortialLoans == null
				? ""
				: String(library.agency.maxConsortialLoans),
		supportHours: library?.supportHours ?? "",
		patronWebsite: library?.patronWebsite ?? "",
		hostLmsConfiguration: library?.hostLmsConfiguration ?? "",
		discoverySystem: library?.discoverySystem ?? "",
		backupDowntimeSchedule: library?.backupDowntimeSchedule ?? "",
		authProfile: library?.agency?.authProfile ?? "",
		// The change log records why the record moved; "because it was
		// incomplete" is the honest default and the user can still edit it.
		reason: "Completing library setup",
		changeReferenceUrl: "",
		libraryId: library?.id ?? "",
		// A library with no contacts fails the schema's minimum, and an empty
		// field array renders a step with nothing on it. Give it a blank one to
		// fill in - which is exactly the outstanding work "finish setup" found.
		contacts: contacts.length > 0 ? contacts : [{ ...EMPTY_CONTACT }],
	};
};

/**
 * Blank means no cap, which is `null` rather than 0 - a 0 would stop the
 * library borrowing anything at all.
 */
const loanCap = (value: string | undefined): number | null =>
	value && value.trim() !== "" ? Number(value) : null;

const buildLibraryProfile = (formData: NewLibraryFormValues) => ({
	agencyCode: formData.agencyCode,
	fullName: formData.fullName,
	shortName: formData.shortName,
	abbreviatedName: formData.abbreviatedName,
	address: formData.address,
	type: formData.type,
	// The form holds coordinates as text, because that is what a text input
	// contains; LibraryInput wants Float. One conversion, at the boundary.
	latitude: Number(formData.latitude),
	longitude: Number(formData.longitude),
	supportHours: formData.supportHours,
	patronWebsite: formData.patronWebsite,
	discoverySystem: formData.discoverySystem,
	hostLmsConfiguration: formData.hostLmsConfiguration,
	backupDowntimeSchedule: formData.backupDowntimeSchedule,
	isBorrowingAgency: formData.isBorrowingAgency,
	isSupplyingAgency: formData.isSupplyingAgency,
	maxConsortialLoans: loanCap(formData.maxConsortialLoans),
	reason: formData.reason,
	// Was rendered but never sent, so the audit trail lost its reference URL.
	changeReferenceUrl: formData.changeReferenceUrl,
	authProfile: formData.authProfile,
});

/**
 * Creating the library, contacts included - CreateLibraryDataFetcher consumes
 * them inline, so no separate createLibraryContact call is needed here.
 */
export const buildLibraryInput = (formData: NewLibraryFormValues) =>
	({
		...buildLibraryProfile(formData),
		hostLmsCode: formData.hostLmsCode,
		contacts: formData.contacts.map((contact) => ({
			firstName: contact.firstName.trim(),
			lastName: contact.lastName.trim(),
			email: contact.email.trim(),
			role: contact.role,
			isPrimaryContact: contact.isPrimaryContact,
		})),
	}) satisfies LibraryInput;

/**
 * `UpdateLibraryInput` declares no `agencyCode`, `isBorrowingAgency`,
 * `isSupplyingAgency`, `maxConsortialLoans`, `hostLmsConfiguration` or
 * `authProfile` - those either belong to the agency or cannot be changed at
 * all. Hence a separate builder rather than reusing the create shape.
 */
export const buildLibraryUpdateInput = (
	formData: NewLibraryFormValues,
	libraryId: string,
) =>
	({
		id: libraryId,
		fullName: formData.fullName,
		shortName: formData.shortName,
		abbreviatedName: formData.abbreviatedName,
		address: formData.address,
		type: formData.type,
		latitude: Number(formData.latitude),
		longitude: Number(formData.longitude),
		supportHours: formData.supportHours,
		patronWebsite: formData.patronWebsite,
		discoverySystem: formData.discoverySystem,
		backupDowntimeSchedule: formData.backupDowntimeSchedule,
		reason: formData.reason,
		changeReferenceUrl: formData.changeReferenceUrl,
	}) satisfies UpdateLibraryInput;

/**
 * The other half of what one profile step shows. Participation and the loan cap
 * belong to the agency, which is keyed on its code rather than an id - see the
 * agency entry in the entity registry.
 */
export const buildAgencyUpdateInput = (formData: NewLibraryFormValues) =>
	({
		code: formData.agencyCode,
		isBorrowingAgency: formData.isBorrowingAgency,
		isSupplyingAgency: formData.isSupplyingAgency,
		latitude: Number(formData.latitude),
		longitude: Number(formData.longitude),
		maxConsortialLoans: loanCap(formData.maxConsortialLoans),
		reason: formData.reason,
		changeReferenceUrl: formData.changeReferenceUrl,
	}) satisfies UpdateAgencyInput;

/**
 * Resuming cannot send contacts through updateLibrary, so each new one is
 * created against the library that already exists.
 */
export const buildContactInput = (
	contact: NewLibraryFormValues["contacts"][number],
	formData: NewLibraryFormValues,
	libraryId: string,
) =>
	({
		libraryId,
		firstName: contact.firstName.trim(),
		lastName: contact.lastName.trim(),
		email: contact.email.trim(),
		role: contact.role,
		isPrimaryContact: contact.isPrimaryContact,
		reason: formData.reason,
		// Required by CreateLibraryContactInput, unlike everywhere else it is
		// optional.
		changeCategory: "Completing library setup",
		changeReferenceUrl: formData.changeReferenceUrl,
	}) satisfies CreateLibraryContactInput;

/** Contacts the user has typed in, as opposed to ones already stored. */
export const newContactsOf = (contacts: NewLibraryFormValues["contacts"]) =>
	contacts.filter((contact) => !contact.id);

/**
 * Whether each step that writes to the server is allowed to write.
 *
 * All three used to be decided by the step id alone, so pressing Back and then
 * Next re-ran the mutation: a duplicate Host LMS code, or a second library
 * colliding on the agency code - and because the step could never succeed
 * again, no way forward either.
 */
export const shouldCreateHostLms = (
	hostLmsCode: string,
	result: HostLmsVerificationResult | null,
): boolean => result?.hostLms?.code !== hostLmsCode;

export const shouldCreateLibrary = (libraryId: string | undefined): boolean =>
	!libraryId;

export const shouldJoinGroup = (
	groupId: string | undefined,
	joinedGroupIds: string[],
): boolean => !!groupId && !joinedGroupIds.includes(groupId);
