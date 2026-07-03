#!/bin/sh
set -eu

# Runs automatically on container start (nginx's official image executes
# every script under /docker-entrypoint.d/ before nginx launches). Renders
# inject_env.json from container env vars so one built image can be deployed
# against any environment - see docs/deployment-docker.md.

vars='${VITE_MUI_X_LICENSE_KEY} ${VITE_KEYCLOAK_URL} ${VITE_KEYCLOAK_ID} ${VITE_DCB_API_BASE} ${VITE_DCB_SEARCH_BASE} ${VITE_ILL_API_BASE} ${VITE_PUBLIC_URL}'

envsubst "$vars" \
	< /usr/share/nginx/html/inject_env.template.json \
	> /usr/share/nginx/html/inject_env.json
