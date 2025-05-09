import { ContactFormData } from "./ContactFormData";

export interface NewLibraryFormData {
	// Basic Information
	fullName: string;
	shortName: string;
	abbreviatedName: string;
	agencyCode: string;
	supportHours?: string;
	address: string;
	type: string;

	// Location and Technical Details
	latitude: number;
	longitude: number;
	patronWebsite?: string;
	hostLmsConfiguration?: string;
	discoverySystem?: string;
	backupDowntimeSchedule?: string;

	// Contacts
	contacts: ContactFormData[];

	// Reason for change
	reason: string;
	changeCategory?: string;
	changeReferenceUrl?: string;
}
