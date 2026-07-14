#!/bin/sh
set -eu

# Runs automatically on container start (nginx's official image executes
# every script under /docker-entrypoint.d/ before nginx launches). Renders
# inject_env.json from container env vars so one built image can be deployed
# against any environment - see docs/deployment-docker.md.

# VITE_PUBLIC_URL is deliberately absent: the base path is baked into the bundle
# by Vite at build time and cannot be changed at runtime. Injecting it here too
# gave the asset base and the router basepath two independent sources that could
# disagree - which mounted the router where its own assets did not resolve.
# This image serves the app at "/"; subpath hosting is done by the Cloudflare
# worker in front of S3 (see docs/worker.js), not here.
vars='${VITE_MUI_X_LICENSE_KEY} ${VITE_KEYCLOAK_URL} ${VITE_KEYCLOAK_ID} ${VITE_DCB_API_BASE} ${VITE_DCB_SEARCH_BASE} ${VITE_ILL_API_BASE}'

envsubst "$vars" \
	< /usr/share/nginx/html/inject_env.template.json \
	> /usr/share/nginx/html/inject_env.json
