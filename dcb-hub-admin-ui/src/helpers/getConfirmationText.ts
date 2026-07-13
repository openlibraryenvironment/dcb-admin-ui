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
		header: "ui.confirmation.header_enable_supplying",
		para1: "ui.confirmation.para1_enable_supplying",
		select: "ui.confirmation.select_enable_supplying",
	},
	disableSupplying: {
		header: "ui.confirmation.header_disable_supplying",
		para1: "ui.confirmation.para1_disable_supplying",
		select: "ui.confirmation.select_disable_supplying",
	},
	enableBorrowing: {
		header: "ui.confirmation.header_enable_borrowing",
		para1: "ui.confirmation.para1_enable_borrowing",
		select: "ui.confirmation.select_enable_borrowing",
	},
	disableBorrowing: {
		header: "ui.confirmation.header_disable_borrowing",
		para1: "ui.confirmation.para1_disable_borrowing",
		select: "ui.confirmation.select_disable_borrowing",
	},
};
