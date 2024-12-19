import { ApolloClient } from "@apollo/client";
import { Dispatch, SetStateAction } from "react";

export const closeConfirmation = (
	setConfirmation: Dispatch<SetStateAction<boolean>>,
	client: ApolloClient<object>,
	refetchQuery: string,
) => {
	setConfirmation(false);
	// This refetches the LoadLibrary query to ensure we're up-to-date after confirmation.
	client.refetchQueries({
		include: [`${refetchQuery}`],
	});
};
