import { NextRouter } from "next/router";
import { Dispatch, SetStateAction } from "react";

export const handleTabChange = (
	event: React.SyntheticEvent,
	newValue: number,
	router: NextRouter,
	setTabIndex: Dispatch<SetStateAction<number>>,
	id?: string,
) => {
	setTabIndex(newValue);
	switch (newValue) {
		case 0:
			router.push(`/libraries/${id}`);
			break;
		case 1:
			router.push(`/libraries/${id}/service`);
			break;
		case 2:
			router.push(`/libraries/${id}/settings`);
			break;
		case 3:
			router.push(`/libraries/${id}/referenceValueMappings/itemType`);
			break;
		case 4:
			router.push(`/libraries/${id}/patronRequests/exception`);
			break;
		case 5:
			router.push(`/libraries/${id}/supplierRequests/all`);
			break;
		case 6:
			router.push(`/libraries/${id}/contacts`);
			break;
		case 7:
			router.push(`/libraries/${id}/locations`);
			break;
		case 8:
			router.push(`/libraries/${id}/bibs`);
			break;
	}
};

export const handlePatronRequestTabChange = (
	event: React.SyntheticEvent,
	newValue: number,
	router: NextRouter,
	setTabIndex: Dispatch<SetStateAction<number>>,
	id?: string,
) => {
	setTabIndex(newValue);
	switch (newValue) {
		case 0:
			router.push(`/libraries/${id}/patronRequests/exception`);
			break;
		case 1:
			router.push(`/libraries/${id}/patronRequests/outOfSequence`);
			break;
		case 2:
			router.push(`/libraries/${id}/patronRequests/active`);
			break;
		case 3:
			router.push(`/libraries/${id}/patronRequests/completed`);
			break;
		case 4:
			router.push(`/libraries/${id}/patronRequests/all`);
			break;
	}
};

export const handleSupplierRequestTabChange = (
	event: React.SyntheticEvent,
	newValue: number,
	router: NextRouter,
	setTabIndex: Dispatch<SetStateAction<number>>,
	id?: string,
) => {
	setTabIndex(newValue);
	switch (newValue) {
		case 0:
			router.push(`/libraries/${id}/supplierRequests/all`);
			break;
	}
};

export const handleMappingsTabChange = (
	event: React.SyntheticEvent,
	newValue: number,
	router: NextRouter,
	setTabIndex: Dispatch<SetStateAction<number>>,
	id?: string,
) => {
	setTabIndex(newValue);
	switch (newValue) {
		case 0:
			router.push(`/libraries/${id}/referenceValueMappings/itemType`);
			break;
		case 1:
			router.push(`/libraries/${id}/numericRangeMappings/itemType`);
			break;
		case 2:
			router.push(`/libraries/${id}/referenceValueMappings/location`);
			break;
		case 3:
			router.push(`/libraries/${id}/referenceValueMappings/patronType`);
			break;
		case 4:
			router.push(`/libraries/${id}/numericRangeMappings/patronType`);
			break;
		case 5:
			router.push(`/libraries/${id}/referenceValueMappings/all`);
			break;
		case 6:
			router.push(`/libraries/${id}/numericRangeMappings/all`);
			break;
	}
};

export const handleTopLevelPatronRequestTabChange = (
	event: React.SyntheticEvent,
	newValue: number,
	router: NextRouter,
	setTabIndex: Dispatch<SetStateAction<number>>,
) => {
	setTabIndex(newValue);
	switch (newValue) {
		case 0:
			router.push(`/patronRequests/exception`);
			break;
		case 1:
			router.push(`/patronRequests/outOfSequence`);
			break;
		case 2:
			router.push(`/patronRequests/active`);
			break;
		case 3:
			router.push(`/patronRequests/completed`);
			break;
		case 4:
			router.push(`/patronRequests/all`);
			break;
	}
};

export const handleConsortiumTabChange = (
	event: React.SyntheticEvent,
	newValue: number,
	router: NextRouter,
	setTabIndex: Dispatch<SetStateAction<number>>,
) => {
	setTabIndex(newValue);
	switch (newValue) {
		case 0:
			router.push("/consortium");
			break;
		case 1:
			router.push("/consortium/functionalSettings");
			break;
		case 2:
			router.push("/consortium/onboarding");
			break;
		case 3:
			router.push("/consortium/contacts");
			break;
	}
};
