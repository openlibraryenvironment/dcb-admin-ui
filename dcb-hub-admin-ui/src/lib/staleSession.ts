import axios from "axios";
import { signOut } from "next-auth/react";

let redirecting = false;
let axiosInstalled = false;
let fetchInstalled = false;
let originalFetch: typeof fetch | null = null;

const isBrowser = () => typeof window !== "undefined";

const isAuthStatus = (status?: number | null) => status === 401 || status === 403;

const currentReturnPath = () => {
	if (!isBrowser()) return "/";
	const path = `${window.location.pathname}${window.location.search}${window.location.hash}`;
	return path.startsWith("/auth/") ? "/" : path;
};

export const redirectForStaleSession = async () => {
	if (!isBrowser() || redirecting) return;
	if (window.location.pathname.startsWith("/auth/")) return;

	redirecting = true;
	const callbackUrl = `/auth/login?sessionExpired=true&callbackUrl=${encodeURIComponent(currentReturnPath())}`;
	await signOut({ callbackUrl });
};

export const installStaleSessionInterceptors = () => {
	if (!isBrowser()) return;

	if (!axiosInstalled) {
		axiosInstalled = true;
		axios.interceptors.response.use(
			(response) => response,
			(error) => {
				if (isAuthStatus(error?.response?.status)) {
					void redirectForStaleSession();
				}
				return Promise.reject(error);
			},
		);
	}

	if (!fetchInstalled && typeof window.fetch === "function") {
		fetchInstalled = true;
		originalFetch = window.fetch.bind(window);
		window.fetch = async (...args) => {
			const response = await originalFetch!(...args);
			if (isAuthStatus(response.status)) {
				void redirectForStaleSession();
			}
			return response;
		};
	}
};
