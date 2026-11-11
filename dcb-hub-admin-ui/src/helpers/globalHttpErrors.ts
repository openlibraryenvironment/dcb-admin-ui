import axios from "axios";

/** 401 and 503 belong to the mutation cache: it renews the session or shows maintenance. */
export const isHandledGlobally = (error: unknown): boolean => {
	const status = axios.isAxiosError(error) ? error.response?.status : undefined;
	return status === 401 || status === 503;
};
