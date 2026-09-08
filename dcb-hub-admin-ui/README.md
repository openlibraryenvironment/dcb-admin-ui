# Welcome to DCB Admin

DCB Admin is the administrative user interface for consortium staff using OpenRS DCB.

## Docker runtime config

The production Docker image builds the Vite SPA and serves it with nginx on container port `80`.
Runtime configuration is rendered into `/usr/share/nginx/html/inject_env.json` from these
environment variables when the container starts:

- `VITE_KEYCLOAK_URL`
- `VITE_KEYCLOAK_ID`
- `VITE_DCB_API_BASE`
- `VITE_DCB_SEARCH_BASE`
- `VITE_MUI_X_LICENSE_KEY`
- `VITE_ILL_API_BASE`

Local compose stacks that generate OIDC client details at startup should export the generated
`VITE_*` values before rerunning `/docker-entrypoint.d/40-inject-env.sh` and starting nginx.
