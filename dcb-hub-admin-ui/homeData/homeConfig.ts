import getConfig from "next/config";

const { publicRuntimeConfig } = getConfig();

const API_LINKS = {
	SERVICE:
		"https://api.github.com/repos/openlibraryenvironment/dcb-service/releases/latest",
	ADMIN_UI:
		"https://api.github.com/repos/openlibraryenvironment/dcb-admin-ui/releases/latest",
};

const LOCAL_VERSION_LINKS = {
	SERVICE: publicRuntimeConfig.DCB_API_BASE,
	SERVICE_INFO: publicRuntimeConfig.DCB_API_BASE + "/info",
	SERVICE_HEALTH: publicRuntimeConfig.DCB_API_BASE + "/health",
	KEYCLOAK: publicRuntimeConfig.KEYCLOAK_URL,
	KEYCLOAK_HEALTH:
		publicRuntimeConfig.KEYCLOAK_URL.split("/", 3).join("/") + "/health",
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
	LOGGERS: publicRuntimeConfig.DCB_API_BASE + "/loggers",
	METRICS: publicRuntimeConfig.DCB_API_BASE + "/metrics",
};

export {
	API_LINKS,
	DCB_SERVICE_STATUS_LINKS,
	LOCAL_VERSION_LINKS,
	REPO_LINKS,
	RELEASE_PAGE_LINKS,
	ONBOARDING_LINKS,
};
