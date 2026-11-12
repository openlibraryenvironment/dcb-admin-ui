import axios from "axios";

/**
 * 401 and 503 go to the query and mutation caches first: a 401 renews the session, and a
 * 503 shows maintenance if dcb-service itself is down. Otherwise the caller's own error shows.
 */
export const isHandledGlobally = (error: unknown): boolean => {
	const status = axios.isAxiosError(error) ? error.response?.status : undefined;
	return status === 401 || status === 503;
};
