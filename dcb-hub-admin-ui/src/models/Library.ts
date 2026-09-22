import { Agency } from "./Agency";
import { HostLMS } from "./HostLMS";
import { Person } from "./Person";

export interface Library {
	id: string;
	fullName: string;
	shortName: string;
	abbreviatedName: string;
	agencyCode: string;
	supportHours: string;
	address: string;
	agency: Agency;
	secondHostLms: HostLMS;
	membership: any;
	type: string;
	latitude: number;
	longitude: number;
	patronWebsite: string;
	hostLmsConfiguration: string;
	discoverySystem: string;
	backupDowntimeSchedule: string;
	training: boolean;
	contacts: Person[];
	secretLabel: string;
	principalLabel: string;
	targetLoanToBorrowRatio?: string | null;
	// Optional because dcb-service before 9.0.0 has no such columns and the document
	// does not select them there - see the consortium_branding capability.
	brandLogoUrl?: string | null;
	brandLogoAlt?: string | null;
	defaultThemeName?: string | null;
}
