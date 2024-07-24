# pull official base image
FROM node:21-alpine AS base

FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat

# set working directory
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i; \
  else echo "Lockfile not found." && exit 1; \
  fi

# 2. Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# This will do the trick, use the corresponding env file for each environment.
# COPY .env.production.sample .env.production
RUN npm run build


FROM nginx:stable-alpine

# This is done to provide a mechanism whereby in k8s we can mount a configmap as this file
# providing a way to set config in a k8s idiomatic way
COPY config-empty.json /usr/share/nginx/html/config.json
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
ENV PORT 80

# start app
CMD ["nginx", "-g", "daemon off;"]
