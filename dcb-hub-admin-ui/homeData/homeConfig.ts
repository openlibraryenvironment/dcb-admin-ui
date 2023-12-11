import getConfig from "next/config";


const { publicRuntimeConfig } = getConfig();

const API_LINKS = {
    SERVICE: 'https://api.github.com/repos/openlibraryenvironment/dcb-service/releases/latest',
    DEVOPS: 'https://api.github.com/repos/openlibraryenvironment/dcb-devops/releases/latest',
    KEYCLOAK: 'https://api.github.com/repos/k-int/gors-hub-keycloak/tags',
    ADMIN_UI: 'https://api.github.com/repos/openlibraryenvironment/dcb-admin-ui/releases/latest'
}

const LOCAL_VERSION_LINKS = {
    SERVICE: publicRuntimeConfig.DCB_API_BASE,
    SERVICE_INFO: publicRuntimeConfig.DCB_API_BASE+'/info',
    SERVICE_HEALTH: publicRuntimeConfig.DCB_API_BASE+'/health',
    KEYCLOAK: publicRuntimeConfig.KEYCLOAK_REFRESH,
    KEYCLOAK_HEALTH: 'https://keycloak.sph.k-int.com/health'
}

const REPO_LINKS = {
    SERVICE: 'https://github.com/openlibraryenvironment/dcb-service/',
    LOCATE: 'https://gitlab.com/knowledge-integration/libraries/dcb-locate/',
    ADMIN_UI: 'https://github.com/openlibraryenvironment/dcb-admin-ui',
    DEVOPS: 'https://github.com/openlibraryenvironment/dcb-devops',
    KEYCLOAK: 'https://github.com/k-int/gors-hub-keycloak/'
}

const RELEASE_PAGE_LINKS = {
    ALL_RELEASES: 'https://openlibraryfoundation.atlassian.net/wiki/spaces/DCB/pages/2685698049/Releases',
    SERVICE: 'https://github.com/openlibraryenvironment/dcb-service/releases',
    LOCATE: 'https://gitlab.com/knowledge-integration/libraries/dcb-locate/-/releases/',
    ADMIN_UI: 'https://github.com/openlibraryenvironment/dcb-admin-ui/releases',
    DEVOPS: 'https://github.com/openlibraryenvironment/dcb-devops/releases',
    KEYCLOAK: 'https://github.com/k-int/gors-hub-keycloak/tags'
}


export { API_LINKS, LOCAL_VERSION_LINKS, REPO_LINKS, RELEASE_PAGE_LINKS };