FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Static SPA, served by nginx - not a Node server. Runtime config
# (inject_env.json) is rendered from container env vars at startup by
# docker-entrypoint.sh, keeping one build deployable to any environment.
FROM nginx:stable-alpine AS runner

# envsubst (gettext) - not guaranteed present in every nginx base image
# variant; installed explicitly rather than assumed, since
# docker-entrypoint.sh depends on it to render inject_env.json.
RUN apk add --no-cache gettext

COPY docker/production/nginx.conf /etc/nginx/conf.d/default.conf
COPY docker/production/inject_env.template.json /usr/share/nginx/html/inject_env.template.json
COPY docker/production/docker-entrypoint.sh /docker-entrypoint.d/40-inject-env.sh
RUN chmod +x /docker-entrypoint.d/40-inject-env.sh

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
