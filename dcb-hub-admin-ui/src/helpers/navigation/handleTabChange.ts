import { AnyRouter } from "@tanstack/react-router";

interface HandleTabChangeProps {
	/** Value passed natively from the MUI Tabs component onChange event (the path string) */
	newValue: string;
	/** The initialized TanStack Router instance */
	router: AnyRouter;
}
export const handleTabChange = ({ newValue, router }: HandleTabChangeProps) => {
	if (!newValue) return;

	// Execute an instant client-side SPA route push
	router.navigate({
		to: newValue,
		replace: false, // Set to true if you don't want tab switches clogging up browser back history
	});
};
