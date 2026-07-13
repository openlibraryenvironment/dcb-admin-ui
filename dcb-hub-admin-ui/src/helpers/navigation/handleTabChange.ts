import { AnyRouter } from "@tanstack/react-router";

interface HandleTabChangeProps {
	/** Value passed natively from the MUI Tabs component onChange event (the path string) */
	newValue: string;
	/** The initialized TanStack Router instance */
	router: AnyRouter;
}

export const handleTabChange = ({ newValue, router }: HandleTabChangeProps) => {
	if (!newValue) return;

	router.navigate({
		to: newValue,
		replace: false,
	});
};
