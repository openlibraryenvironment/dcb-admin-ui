export function getConfirmationFirstPara(participation: string): string {
	switch (participation) {
		case "enableSupplying":
			return "libraries.circulation.confirmation.para1_enable_supplying";
		case "disableSupplying":
			return "libraries.circulation.confirmation.para1_disable_supplying";
		case "enableBorrowing":
			return "libraries.circulation.confirmation.para1_enable_borrowing";
		case "disableBorrowing":
			return "libraries.circulation.confirmation.para1_disable_borrowing";
		default:
			return ""; // Return a default key instead
	}
}

export function getConfirmationSecondPara(participation: string): string {
	switch (participation) {
		case "enableSupplying":
			return "libraries.circulation.confirmation.select_enable_supplying";
		case "disableSupplying":
			return "libraries.circulation.confirmation.select_disable_supplying";
		case "enableBorrowing":
			return "libraries.circulation.confirmation.select_enable_borrowing";
		case "disableBorrowing":
			return "libraries.circulation.confirmation.select_disable_borrowing";
		default:
			return "";
	}
}

export function getConfirmationHeader(participation: string): string {
	switch (participation) {
		case "enableSupplying":
			return "libraries.circulation.confirmation.header_enable_supplying";
		case "disableSupplying":
			return "libraries.circulation.confirmation.header_disable_supplying";
		case "enableBorrowing":
			return "libraries.circulation.confirmation.header_enable_borrowing";
		case "disableBorrowing":
			return "libraries.circulation.confirmation.header_disable_borrowing";
		default:
			return "";
	}
}
