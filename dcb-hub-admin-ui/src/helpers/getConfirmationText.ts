export type ParticipationAction =
	| "enableSupplying"
	| "disableSupplying"
	| "enableBorrowing"
	| "disableBorrowing";

export const CONFIRMATION_TEXT_MAP: Record<
	ParticipationAction,
	{ header: string; para1: string; select: string }
> = {
	enableSupplying: {
		header: "libraries.circulation.confirmation.header_enable_supplying",
		para1: "libraries.circulation.confirmation.para1_enable_supplying",
		select: "libraries.circulation.confirmation.select_enable_supplying",
	},
	disableSupplying: {
		header: "libraries.circulation.confirmation.header_disable_supplying",
		para1: "libraries.circulation.confirmation.para1_disable_supplying",
		select: "libraries.circulation.confirmation.select_disable_supplying",
	},
	enableBorrowing: {
		header: "libraries.circulation.confirmation.header_enable_borrowing",
		para1: "libraries.circulation.confirmation.para1_enable_borrowing",
		select: "libraries.circulation.confirmation.select_enable_borrowing",
	},
	disableBorrowing: {
		header: "libraries.circulation.confirmation.header_disable_borrowing",
		para1: "libraries.circulation.confirmation.para1_disable_borrowing",
		select: "libraries.circulation.confirmation.select_disable_borrowing",
	},
};
