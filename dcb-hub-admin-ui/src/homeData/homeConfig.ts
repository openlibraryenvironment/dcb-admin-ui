const API_LINKS = {
	SERVICE:
		"https://api.github.com/repos/openlibraryenvironment/dcb-service/tags",
	ADMIN_UI:
		"https://api.github.com/repos/openlibraryenvironment/dcb-admin-ui/releases/latest",
};

// Helper utility to safely retrieve the environment configuration globally
// following the bootstrap injection strategy in your main.tsx
const getEnvConfig = () => {
	if (typeof window !== "undefined" && window.__APP_ENV__) {
		return window.__APP_ENV__;
	}
	// Fallback to static Vite environment variables if running in testing or edge environments
	return {
		VITE_DCB_API_BASE: String(import.meta.env.VITE_DCB_API_BASE || ""),
		VITE_KEYCLOAK_URL: String(import.meta.env.VITE_KEYCLOAK_URL || ""),
	};
};

// Converted to getters to prevent early initialization crashes and evaluate variables dynamically
const LOCAL_VERSION_LINKS = {
	get SERVICE() {
		return getEnvConfig().VITE_DCB_API_BASE;
	},
	get SERVICE_INFO() {
		return `${getEnvConfig().VITE_DCB_API_BASE}/info`;
	},
	get SERVICE_HEALTH() {
		return `${getEnvConfig().VITE_DCB_API_BASE}/health`;
	},
	get KEYCLOAK() {
		return getEnvConfig().VITE_KEYCLOAK_URL;
	},
	get KEYCLOAK_HEALTH() {
		const keycloakUrl = getEnvConfig().VITE_KEYCLOAK_URL || "";
		return `${keycloakUrl.split("/", 3).join("/")}/health`;
	},
	get TRACKING() {
		return `${getEnvConfig().VITE_DCB_API_BASE}/admin/trackingConfiguration`;
	},
};

const REPO_LINKS = {
	SERVICE: "https://github.com/openlibraryenvironment/dcb-service/",
	LOCATE: "https://gitlab.com/knowledge-integration/libraries/dcb-locate/",
	ADMIN_UI: "https://github.com/openlibraryenvironment/dcb-admin-ui",
	DEVOPS: "https://github.com/openlibraryenvironment/dcb-devops",
	KEYCLOAK:
		"https://gitlab.com/knowledge-integration/libraries/dcb-keycloak-extensions",
};

const RELEASE_PAGE_LINKS = {
	ALL_RELEASES:
		"https://openlibraryfoundation.atlassian.net/wiki/spaces/DCB/pages/2685698049",
	SERVICE: "https://github.com/openlibraryenvironment/dcb-service/releases",
	LOCATE:
		"https://gitlab.com/knowledge-integration/libraries/dcb-locate/-/releases/",
	ADMIN_UI: "https://github.com/openlibraryenvironment/dcb-admin-ui/releases",
	DEVOPS: "https://github.com/openlibraryenvironment/dcb-devops/releases",
	KEYCLOAK:
		"https://gitlab.com/knowledge-integration/libraries/dcb-keycloak-extensions/-/releases",
};

const ONBOARDING_LINKS = {
	INTRODUCE_LIBRARIES:
		"https://openlibraryfoundation.atlassian.net/wiki/spaces/DCB/pages/2724134932/",
	PROVISION_SYSTEMS:
		"https://openlibraryfoundation.atlassian.net/wiki/spaces/DCB/pages/2724200457/",
	CONFIGURE_SERVICES:
		"https://openlibraryfoundation.atlassian.net/wiki/spaces/DCB/pages/2724134947/",
	MIGRATE_SERVICE:
		"https://openlibraryfoundation.atlassian.net/wiki/spaces/DCB/pages/2724134961/",
	OPERATE_DCB:
		"https://openlibraryfoundation.atlassian.net/wiki/spaces/DCB/pages/2723643452/",
	MANAGE_SUPPORT:
		"https://openlibraryfoundation.atlassian.net/wiki/spaces/DCB/pages/2724167720/",
};

const DCB_SERVICE_STATUS_LINKS = {
	get LOGGERS() {
		return `${getEnvConfig().VITE_DCB_API_BASE}/loggers`;
	},
	get METRICS() {
		return `${getEnvConfig().VITE_DCB_API_BASE}/metrics`;
	},
};

export {
	API_LINKS,
	DCB_SERVICE_STATUS_LINKS,
	LOCAL_VERSION_LINKS,
	REPO_LINKS,
	RELEASE_PAGE_LINKS,
	ONBOARDING_LINKS,
};
