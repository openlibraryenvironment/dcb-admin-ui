# DCB Admin UI Deployment Guide

This document outlines how to configure and deploy DCB Admin. The application is a React Single Page Application (SPA) built with Vite.

Because it is a static SPA, it can be hosted in several ways. We officially support three deployment targets: **AWS (S3 + CloudFront)**, **Cloudflare Pages**, and **Docker**. Other methods of hosting SPAs may work, but are not officially supported. Please feel free to contribute if you have a new way of hosting the app!

## 1. Global Prerequisites: Keycloak Setup

Before deploying the application, you must configure your OpenRS Keycloak system so the application can authenticate users securely.

Log into your Keycloak dashboard, select the `dcb-hub` realm, and complete these steps exactly as written:

1. Add a custom attribute called `code` to every user requiring access.
2. Ensure this value strictly corresponds to their library's agency code.
3. Navigate to **Client Scopes**, then select **profile**.
4. Add a **User Attribute Mapper** for the `code` attribute.
5. Select **"by configuration"** so the application can successfully extract it from the token.
6. Configure a new PKCE client.
7. Ensure the client name matches the `VITE_KEYCLOAK_ID` you plan to use in your environment variables.
8. Set the flow to **Standard flow**.
9. Turn **OFF** client authentication (this must be a public access type, not a confidential OIDC client).
10. Under the "Advanced" tab, set the Proof Key for Code Exchange (PKCE) Code Challenge Method to **S256**.
11. Set the **Valid Redirect URIs** and **Web Origins** strictly to the exact URL where the application will be hosted (e.g., `https://admin.yourlibrary.org`). Never use a wildcard (`*`) in production, as this may allow malicious sites to steal user tokens.
12. If the app is hosted under a **subpath** (see Section 3, Option A), the redirect URI must include that subpath — `https://mobius.kihosting.net/dcb-admin/*`, not the bare host. The app redirects to its own base, and the origin root serves no app when several are mounted under prefixes. **Web Origins** remains the bare origin (`https://mobius.kihosting.net`), as it is an origin, not a URL.

13. Add the **`roles` mapper** described immediately below. Every other step can be right and the application still refuse everyone without it.

### The `roles` claim, and why sign-in succeeds without it

**Confirmed 2026-09-09 on `mobius-test`.** Every account signed in successfully and then met
"401 Unauthorised — Sorry, you do not have access to this page". Nothing was wrong with the
deployment, the consortium or the backend. The client had no mapper putting roles in the
token.

DCB Admin decides what an account may do from a **flat `roles` claim**, read as
`auth.user.profile.roles` and folded into one predicate in `helpers/consortiumAccess.ts`. It
must contain `ADMIN` or `CONSORTIUM_ADMIN`, spelled in exact upper case. Anything else,
including the claim being absent, means the account may not use DCB Admin at all and is sent
to `/unauthorised`.

**Keycloak's built-in roles scope does not satisfy this.** It writes `realm_access.roles`,
nested one level down, and the application does not read that. Assigning somebody the realm
role is therefore _not enough on its own_: the role exists, the token does not carry it where
anything looks.

On the client, under _Client scopes → `<client>-dedicated` → Add mapper → By configuration →
**User Realm Role**_:

| Field               | Value   |
| ------------------- | ------- |
| Token Claim Name    | `roles` |
| Claim JSON Type     | String  |
| Multivalued         | **On**  |
| Add to ID token     | **On**  |
| Add to access token | **On**  |
| Add to userinfo     | **On**  |

**All three token targets, and they are not redundant.** The UI reads the ID token and the
userinfo response, because it runs with `loadUserInfo: true`. `dcb-service` reads the
**access token**, for `CallerScope` and for `AdminUiAccessPolicy`. Set only the ID token and
the UI works while the API refuses; set only the access token and the UI refuses before a
request is ever sent. Do both applications' clients, not just this one.

#### The symptom is a refusal page, not an HTTP status

This failure announces itself in the least helpful way available: the sign-in succeeds, so
the identity provider looks fine, and the page that follows is titled with a number that
sends people to look at the network tab, where nothing is wrong.

- **It is not an HTTP 401.** The page is `ui.error.401`, rendered by a client-side role
  check. No request failed to produce it.
- **A genuine 403 from `/graphql` is a different fault** — `AdminUiAccessPolicy` refusing a
  token whose `azp` is DCB Admin's client. Same root cause, opposite side.
- **A genuine 401 from `/graphql` is neither.** That is the token being rejected outright:
  wrong issuer, wrong realm, or expired. Check `VITE_KEYCLOAK_URL` against the issuer
  `dcb-service` trusts.

Confirm which you have from the browser console, signed in:

```js
Object.keys(localStorage)
	.filter((k) => k.startsWith("oidc.user:"))
	.forEach((k) => {
		const u = JSON.parse(localStorage.getItem(k));
		const claims = JSON.parse(
			atob(u.access_token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
		);
		console.log(k, "roles:", u.profile.roles, "azp:", claims.azp);
	});
```

`undefined` roles is this mapper. A populated array without `ADMIN` or `CONSORTIUM_ADMIN` is
the role assignment on the account instead. It iterates rather than naming one key because a
shared origin holds a session per app: read the row whose `azp` is DCB Admin's client.

**Roles do not travel between environments.** Each one has its own realm, so a new hostname
pointed at a Keycloak that has never served DCB Admin needs the mapper and the role
assignments made again there. `mobius-staging` and `mobius-test` use different identity
providers entirely.

The backend's own account of the roles, the `code` agency claim and the client separation is
`dcb-service/docs/identity-provider-setup.md` §1.1–1.4. It is the authority on what the roles
mean; this section is the part DCB Admin cannot start without.

---

## 2. Environment Variables

The application requires the following environment variables to function properly. How you apply them depends on your chosen deployment method (see Section 3).

| Variable                 | Required | Description                                                                                                                                                                                                                                                                        |
| ------------------------ | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_KEYCLOAK_URL`      | **Yes**  | The URL of the Keycloak server being used for your OpenRS system.                                                                                                                                                                                                                  |
| `VITE_KEYCLOAK_ID`       | **Yes**  | The name of the Keycloak client                                                                                                                                                                                                                                                    |
| `VITE_DCB_API_BASE`      | **Yes**  | The URL of the dcb-service instance.                                                                                                                                                                                                                                               |
| `VITE_DCB_SEARCH_BASE`   | **Yes**  | The URL of the dcb-locate instance.                                                                                                                                                                                                                                                |
| `VITE_MUI_X_LICENSE_KEY` | **Yes**  | Provided by the Hosting Provider. Unlocks MUI X Premium features. It is OK for this to be exposed in the bundle: it is not OK for this to be publicly broadcast (i.e. committed to a repository). See [MUI X docs](https://mui.com/x/introduction/licensing/#license-key-security) |

                            |

| `VITE_PUBLIC_URL` | No | Standalone base path. Defaults to `/`. Must include leading and trailing slashes (e.g. `/dcb-admin/`). **Build-time only.** The standalone entry uses it for assets, routing, translations and storage. The bootloader entry always routes at `/` and resolves assets from its own bundle URL. |

---

## 2a. Feature flags: which dcb-service this deployment is talking to

DCB Admin runs against **more than one dcb-service release**. That is deliberate: a v9
upgrade takes time to reach production, and the admin UI ships on its own cadence. The
features that need a newer backend are each behind a runtime flag, so an environment turns
them on **when its own dcb-service is upgraded, with no rebuild and no new artifact** —
`docker-entrypoint.sh` renders `inject_env.json` from the container environment on every
start, so a changed variable plus a container restart is the whole procedure.

**Every flag is off unless it is explicitly `true`.** An unset variable, an empty string,
`0` and `yes` are all read as off, so an environment that has never heard of a flag simply
does not show the feature.

**On Cloudflare these are not variables you set.** Section 3, Option A derives the whole
block from one field — the dcb-service version named in the host's `hostEnv()` case — so
the table below is the reference for what the flags mean, not a list of bindings to create.
Setting them by hand belongs to the other two pathways, where the config is written rather
than computed.

| Variable                                 | Enable at dcb-service                 | What it turns on                                                                                                                              |
| ---------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_FEATURE_CONSORTIUM_BRANDING`       | **9.0.0** or later                    | The consortium Branding tab, the setup wizard's Discovery chapter, brand image upload, and the merged brand columns in the consortium queries |
| `VITE_FEATURE_NCIP_ONBOARDING`           | **9.0.0** or later                    | Service Info → DCB NCIP onboarding (`/api/v1/dcb-profile-ncip2`)                                                                              |
| `VITE_FEATURE_INSIGHTS`                  | **9.0.0** or later                    | Insights, consortium- and library-level (`/insights`)                                                                                         |
| `VITE_FEATURE_LIBRARY_USER_PROVISIONING` | **dcb-service main** — no release yet | A library's Accounts tab: inviting, enabling and re-inviting DCB Admin for Libraries users                                                    |
| `VITE_FEATURE_LOCAL_HOLDS`               | **dcb-service main** — no release yet | The per-agency maximum local holds field on a library's Settings tab                                                                          |
| `VITE_FEATURE_CONSORTIUM_SUPPORT_URL`    | **no release serves this yet**        | The consortium's patron support link on the consortium form                                                                                   |
| `VITE_FEATURE_AUDIT_EXPLORER`            | **no release serves this yet**        | Service Info → Audit Explorer                                                                                                                 |

Note the last three rows. There is deliberately **no single "we are on v9 now" switch**:
account provisioning and the local holds limit are on dcb-service `main` but in _no
release_ — not 8.71.0, not the 9.0.0 tag — and the audit explorer has no backend anywhere.
One boolean would be a lie about all three, and turning it on at the v9 upgrade would break
all three.

### Checking, and what happens if you get it wrong

**Service Info → Feature availability** lists every flag, the dcb-service version it needs,
the version this deployment reports from `/info`, and whether the flag is on. It warns in
two directions: a feature that is now served but still switched off (turn it on), and a
flag switched on ahead of the upgrade (turn it off — the feature will fail).

A flag left **off** after the upgrade costs nothing but a hidden feature. A flag switched
**on** too early is the expensive mistake: the newer GraphQL fields do not degrade
gracefully, because a field the server does not declare is a validation error that fails
the whole operation. Switched on against 8.71.0, the consortium section, the setup wizard
and the header all stop working at once.

---

## 3. Deployment Pathways

Choose the deployment method that matches your infrastructure - Cloudflare is currently preferred for official OpenRS deployments, but choose what works for you.

### KI bootloader bundle

`npm run build` creates one `dist/` artifact with the standalone `index.html`
and a fixed adapter entry point:

```ts
mount({ element, config }): Promise<void>
```

Publish the same directory to existing standalone destinations and as
`dcb-hub-admin-ui/<version>/`. Configure the neutral bootloader with app
`dcb-hub-admin-ui` and that version. The supplied config uses the variables in
Section 2. Asset and translation URLs resolve from the versioned bundle;
application routes remain at `/`.

The Docker image, S3 paths, `inject_env.json`, and local `npm run dev` flow remain
unchanged.
**How versions get there, and what to set in KI Console.** `deploy_release_to_r2` runs on
the **release branch** pipeline, not on a tag. It has to: semantic-release tags its own
commit, whose message ends `[skip ci]`, and GitLab reads that on the tag push too — so a
tag-triggered job is skipped every time and never runs. That is why the bootloader answered
404 for every version until this was moved.

It publishes `dcb-hub-admin-ui/$RELEASE_VERSION/` and then rewrites
`dcb-hub-admin-ui/latest.json`, in that order, so the channel never names a directory that
is not there yet. `deploy_dev_to_r2` keeps `dcb-hub-admin-ui/next/` in step with `main`.

The version string must match fe-bootloader's `VERSION_PATTERN`:

```
next | latest | vX.Y.Z
```

**The `v` is mandatory** — `2.0.0` is rejected as "Invalid version" before any request is
made. `latest` resolves through `latest.json`, so it only works once a release has been
published.

### Option A: Cloudflare Worker in front of S3

**Architecture:** CI builds each app and syncs it to its own key prefix in a shared S3 bucket. A single Cloudflare Worker, whose source is not held in this repository, sits in front, mounting each app at a path prefix on every domain and supplying its environment-specific config at runtime via `<base>inject_env.json`:

```
mobius.kihosting.net/dcb-admin                -> s3://<bucket>/prod/dcb-admin/
mobius.kihosting.net/dcb-admin-for-libraries  -> s3://<bucket>/prod/dcb-admin-for-libraries/
dev.kihosting.net/dcb-admin                   -> s3://<bucket>/dev/dcb-admin/
```

**The key is `<env-root>/<app>/`.** The app prefix is the first URL path segment and maps
1:1 onto the key, so the worker does no asset-path rewriting. The env root is chosen by
hostname and never appears in the URL, which is what stops a merge to `main` from
overwriting production: without it every host reads the same key and CI has nowhere to put
a dev build that is not also the prod build. Staging and the EBSCO integration read the
`prod` root deliberately, being production builds pointed at different backends.

**"Build once, deploy anywhere" holds across _hostnames_, never across _base paths_.** The backends, Keycloak client and licence key are runtime config and vary by host, so one artifact serves every environment at a given mount point. The base path is not runtime config — it is baked in by Vite — so each mount point needs its own build. That costs nothing, since the apps are separate builds anyway.

**Deployment Steps:**

1. Build each app with its mount point as the base, and sync it to the matching key prefix:

   ```bash
   VITE_PUBLIC_URL=/dcb-admin/ npm run build
   aws s3 sync dist/ s3://<bucket>/dev/dcb-admin/ --delete
   ```

   The base path carries no env root; the S3 key does. One build is promoted between roots.

   Keep `--delete` scoped to `<env-root>/<app>/`. One level up it wipes the sibling apps,
   two levels up it wipes the sibling environments.

2. Set the environment variables from Section 2 on the Worker (Settings → Variables), keyed per environment as `hostEnv()` in the worker expects. **Not the feature flags** — those are derived, see below.
3. Deploy the worker with `wrangler deploy`.
4. Point traffic at it in the Cloudflare dashboard:
   - **Routes** (`mobius.kihosting.net/dcb-admin*`) if the hostname also serves anything else — a route only claims matching paths.
   - **A Custom Domain** if the hostname is dedicated to these apps; it claims the whole host and creates the DNS record for you.
   - Routes require an existing **proxied (orange-cloud)** DNS record for the hostname. A grey-cloud record bypasses Workers entirely, and the usual symptom is that nothing you deploy appears to take effect.
5. Update Keycloak's Valid Redirect URIs to include each subpath (Section 1, step 12).

**Adding another app:** add its prefix to `APPS`, a case to `appConfig()` and a table to
`APP_FEATURES` in the worker, then point its CI at the matching S3 key prefix. Nothing else
changes.

#### Feature flags are derived from the host's dcb-service, not bound per environment

The worker serves both apps on every host, and each app has its own flag names with their
own version thresholds. Setting those by hand would be thirty worker variables whose only
job is to be got right twice, and an unbound one is indistinguishable from a deliberate
`false`. So each `hostEnv()` case names the dcb-service that host talks to, and
`APP_FEATURES` maps each flag to the version that first serves it. The block in
`inject_env.json` is computed from the two.

| Host                               | dcb-service | S3 root |
| ---------------------------------- | ----------- | ------- |
| `mobius.kihosting.net`             | 8.71.0      | `prod`  |
| `mobius-staging.kihosting.net`     | 8.71.0      | `prod`  |
| `ebsco-integration.kihosting.net`  | 8.71.0      | `prod`  |
| `dev.kihosting.net`                | `main`      | `dev`   |
| `mobius-test.kihosting.net`        | `main`      | `dev`   |
| `prospector-staging.kihosting.net` | `main`      | `dev`   |

`root` and `service` are separate fields although they agree on every host today. They
answer different questions — which _build_ of the apps, and which _backend_ that build is
pointed at — and the first host to run a production build against a main-tracking service
is the one a single field would silently give the wrong flags.

**So an upgrade is a one-line worker change**: move the host's `service` to the new version
and `wrangler deploy`. `inject_env.json` is served `no-store`, so it takes effect on the
next page load — no rebuild, no re-sync, no cache purge. A rollback is the same line back.

**Nothing in this repository gates this.** No check here compares a flag declared in
`featureFlags.ts` against `APP_FEATURES`, or a host's `service` against the table above, so
a flag added on one side and not the other is caught by review or not at all. The
`dcb-admin-for-libraries` table is unchecked for the same reason and one more: that repo
cannot see this file, and its flag list is not published as a build artefact alongside its
bundle. Both flag sets live in the worker because one worker serves both apps, not because
this repo owns them.

**Adding another environment** is a different job with a different order and its own
failure modes. It is the section below, and the code change is the last step in it.

#### Adding an environment: a new hostname

`hostEnv()` is keyed by hostname and returns the S3 root, the backends and the dcb-service
version, so a new environment is one `case` there. **That case is inert until Cloudflare is told to run the
worker for the hostname, and that is a dashboard change no edit in this repository can
make.** Do the binding first; the code is the last step and the smallest.

Confirmed 2026-09-09: `mobius-test` and `prospector-staging` were added to `hostEnv()`
alongside a working `mobius-staging` and appeared to change nothing. Both hostnames
answered, so nothing looked unbound. What answered was S3, not the worker.

In order:

1. **A proxied (orange-cloud) DNS record** for the hostname must exist. A grey-cloud record
   bypasses Workers entirely.
2. **Bind the hostname to the worker.** A **Custom Domain** on the worker if the host is
   dedicated to these apps, which claims the whole host and creates the DNS record for you;
   a **Route** of `<host>/*` if the host serves anything else. Copy whatever an already
   working hostname has.
3. **Set the three variables** on the worker, named for the environment exactly as the new
   `case` reads them: `KEYCLOAK_URL_<ENV>`, `DCB_API_BASE_<ENV>`, `DCB_SEARCH_BASE_<ENV>`.
   The per-app `KEYCLOAK_ID_*` and the licence key are shared and already set.
4. **Check the S3 root is populated** for every app the host will serve, and point that
   environment's CI at `<env-root>/<app>/`. A root with no build is a 502, not a 404.
5. **Add the `hostEnv()` case** — including `service`, the dcb-service version that host
   talks to — add its row to the host table above, and deploy the worker. Getting `service`
   wrong is the quiet failure: too low hides features that work, too high takes both apps
   down, and nothing checks that the case and the table agree.
6. **Add the redirect URIs to Keycloak** for each subpath on that hostname, in both clients
   (Section 1, step 12). This is the step that fails last and looks like an app bug.

**This repository holds neither the worker nor its wrangler config.** Nothing here deploys
it and no copy of `worker.js` is kept here to read. Find out where the worker project
actually lives before assuming an edit made from this guide has shipped.

##### Triage: read the response body, not the status code

Every failure below returns something that renders as "the site is broken". The body says
which one it is, and they need different people to fix them.

| What comes back                                                           | What actually happened                                                                                                                                                                         | Fix                                         |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| S3 XML, `<Code>NoSuchBucket</Code>` naming the **hostname** as the bucket | The request never reached the worker. No Route or Custom Domain claims this host, so Cloudflare passed it through to the zone's origin, which is S3 resolving a bucket from the `Host` header. | Step 2. Editing the worker cannot fix this. |
| Plain text, `No configuration for host "<host>"`                          | The worker ran and `hostEnv()` returned `null`. Either the `case` is missing, or the deployed worker predates your edit.                                                                       | Step 5.                                     |
| Plain text, `Missing runtime config for "<app>" on "<host>": <names>`     | Route and `case` are both fine. The named worker variables are unbound.                                                                                                                        | Step 3, using the names in the message.     |
| Plain text, `Host "<host>" declares dcb-service "<value>"`                | The `case` has a `service` that is neither `main` nor an `x.y.z` release. Left unchecked this resolves every flag to `false`, which looks like a deliberately cautious environment.            | Step 5.                                     |
| Plain text, `App "<app>" is not deployed to "<root>"` (502)               | The worker resolved the host to an env root that holds no `index.html` for that app.                                                                                                           | Step 4.                                     |
| A 302 to `/dcb-admin-for-libraries/`                                      | The first path segment is not in `APPS`. Expected at `/`; otherwise the URL is wrong.                                                                                                          | None, if you asked for `/`.                 |
| The app loads, then the sign-in button does nothing                       | Keycloak has no redirect URI for this hostname.                                                                                                                                                | Step 6.                                     |

Verify a new hostname end to end with the status code alone:

```bash
curl -s -o /dev/null -w '%{http_code}' https://<host>/dcb-admin/inject_env.json; echo
```

**Do not paste that response into a ticket or a chat.** It carries the MUI X licence key,
which is fine in a bundle the browser fetches and not fine in a pastebin. A `200` is the
whole answer you need; anything else, read the body yourself and match it against the table.

#### Sharing one origin with DCB Admin for Libraries

Both apps are gated for it — `npm run e2e:base-path` here, and the equivalent suite in
`dcb-admin-for-libraries`. What the gates cannot see is the four things outside the bundle.

**`/dcb-admin` is a proper prefix of `/dcb-admin-for-libraries`.** Any prefix match in the
worker must be longest-first or segment-exact. A `startsWith` over `APPS` in declaration
order serves the consortium app's `index.html` for every libraries URL, and the browser
then parses HTML as a JavaScript module: blank page, `Unexpected token '<'`. The same
applies to a Cloudflare **Route** of `mobius.kihosting.net/dcb-admin*`, which claims both
paths.

**Two Keycloak clients, and they must stay two.** Confirmed 2026-09-08: one client for
`dcb-admin`, one for `dcb-admin-for-libraries`. Keep it that way. oidc-client-ts keys the
stored session `oidc.user:{authority}:{client_id}`, so a single client id shared by both
apps would be a single session object shared by both — and their role expectations differ.
Nothing in the code enforces the separation, and a shared client would not collide today
only by accident: this app sets `userStore` to `localStorage` explicitly, the other sets
none, and oidc-client-ts defaults it to `sessionStorage`. Harmonising that while sharing a
client is the collision. Both subpaths also need to be in each client's Valid Redirect URIs.

**Everything else in web storage is namespaced by the base** — `dcb-admin:` here,
`dcb-admin-for-libraries:` there, and the sign-out purge is prefix-scoped rather than a
`storage.clear()` that would take the sibling's state with it. The colon is what keeps
`dcb-admin:` from matching `dcb-admin-for-libraries:`; the base-path gate asserts the
namespace is not `root:`.

**The security headers are the worker's, not this repo's.** `docker/production/` is the
nginx image; there is no nginx on this path. On a shared origin one app's XSS is the
other's, so the CSP matters more here, not less — and it has to live somewhere reviewable.

### Option B: AWS (S3 + CloudFront)

**Architecture:** This approach uses a static build. Because S3 has no server-side execution, environment variables cannot be injected at runtime. Every `VITE_*` value is permanently baked into the JavaScript bundle during the build phase. You must build a separate artifact for each environment (dev, staging, production).

**Architecture Note** (main.tsx Fallback): On a plain S3 bucket, there is no server-side component to generate `inject_env.json`. The application deliberately attempts to fetch this file, and when it receives a 404 error, it intentionally falls back to the build-time `import.meta.env.VITE_*` variables.

**Do not combine this with Option A.** The `403/404 -> index.html (200)` error-document mapping below is what makes a root-hosted SPA work, but it means a missing asset comes back as _HTML with a 200_. Behind the worker that is fatal and indistinguishable from a real file: the browser parses HTML as a JavaScript module and you get a blank page and `Unexpected token '<'`. The worker therefore talks to the **S3 REST endpoint** (`https://<bucket>.s3.<region>.amazonaws.com`, which 404s honestly and is HTTPS), never the `s3-website` endpoint (which is plaintext HTTP and applies error-document rewriting), and does the SPA fallback itself.

**Deployment Steps:**

1. Export all environment variables listed in Section 2 on your build machine (or in your CI/CD runner).
2. Run `npm run build` to generate the `dist/` directory.
3. Sync the `dist/` directory to your S3 bucket.
4. Ensure your sync command sets `Cache-Control: no-store, no-cache, must-revalidate` strictly on `/index.html` to guarantee users always receive the latest app updates instantly.
5. Configure CloudFront's custom error responses.
6. Map `403` and `404` errors to return `/index.html` with a `200` status.
7. Ensure this is configured so the application's client-side routing can handle deep links and page refreshes correctly.

**CI/CD Deployment example**

Using "staging" as an example environment.

##### 1. Build the application with environment variables

`VITE_KEYCLOAK_URL=https://staging-keycloak... VITE_DCB_API_BASE=https://staging-api... npm run build`

##### 2. Sync the built assets to your S3 bucket

`aws s3 sync dist/ s3://dcb-admin-staging --delete`

##### 3. Invalidate the CloudFront cache (crucial for /index.html)

`aws cloudfront create-invalidation --distribution-id <id> --paths "/index.html" "/*"`

### Option C: Docker (Self-Hosted / Portable)

**Architecture:** Similar to Cloudflare, this uses a runtime-config approach. The provided Dockerfile builds the app and serves it via an Nginx alpine container (`nginx:stable-alpine`). An entrypoint script uses `envsubst` to dynamically inject the container's environment variables into the app when the container boots.

**Security Note**: The Dockerfile deliberately uses floating minor-version tags (e.g., node:22-alpine, nginx:stable-alpine) rather than pinned patch versions. This ensures that every time the image is rebuilt, it automatically picks up the latest base-OS security patches.

**Deployment Steps:**

1. Build the image using `docker build -f docker/production/Dockerfile -t dcb-admin-ui .`.
2. Run the container, passing in your environment variables via the `-e` flag.
3. Map the port correctly, keeping in mind the application runs on port `80` inside the container.

**Run Command Example:**

```bash
docker run -p 8080:80 \
  -e VITE_MUI_X_LICENSE_KEY="..." \
  -e VITE_KEYCLOAK_URL="https://keycloak..." \
  -e VITE_KEYCLOAK_ID="dcb-admin" \
  -e VITE_DCB_API_BASE="https://api..." \
  -e VITE_DCB_SEARCH_BASE="https://search..." \
  -e VITE_FEATURE_CONSORTIUM_BRANDING="true" \
  -e VITE_FEATURE_NCIP_ONBOARDING="true" \
  -e VITE_FEATURE_INSIGHTS="true" \
  dcb-admin-ui

```

The three feature flags above are the dcb-service **9.0.0** set (see Section 2a). Against
8.71.0, leave them out. Switching them on later is a changed `-e` and a container restart:
`docker-entrypoint.sh` re-renders `inject_env.json` on every start, so the bundle never has
to be rebuilt.

## 4. Security Note: PKCE vs. Traditional Client Secrets

In the latest versions of DCB Admin and DCB Admin for Libraries, we now strictly require the Proof Key for Code Exchange (PKCE) method instead of the traditional "Client Secret" flow for Keycloak authentication. This section explains why we have made this decision.

**High Exposure Risk:** Traditional OAuth2 flows rely on a static "Client Secret" to exchange an authorization code for an access token. This can be easy to steal.

**No Secure Storage**: In a static SPA, there is no secure backend server to hide this secret. If a Client Secret were used, it would have to be embedded into the frontend JavaScript, making it trivially easy for anyone inspecting the browser source code or network tab to steal it.
PKCE was explicitly designed to secure public clients like SPAs and mobile applications where secrets cannot be hidden.

**Dynamic Verification** Instead of relying on a static, unchanging secret, PKCE generates a unique, temporary cryptographic "Code Verifier" and "Code Challenge" for every single login attempt.

**Interception Protection**
When the application requests an access token, it must provide the original verifier. Even if a malicious actor (such as a compromised browser extension) intercepts the authorization code during the redirect, it is completely useless without the original verifier (which remains secure in the legitimate user's local browser memory).

**OAuth Best Practice**
Using PKCE (specifically with the S256 hashing method) is the current industry gold standard and is recommended by the OAuth 2.0 Security Best Current Practice guidelines.

---

# Serving the built artefact

Three things about the artefact itself, all of which shipped broken at least once and each
of which is invisible from the code that causes them.

## A deploy must not white-screen a cached tab

`autoCodeSplitting` makes all 84 routes dynamic imports, and every deploy removes the
previous build's hashed chunks (`aws s3 sync --delete`, and the R2 channel likewise). A
browser still holding the **old** `index.html` therefore asks for filenames that are gone,
and every navigation dies with `Failed to fetch dynamically imported module` — a blank page,
on every hosting provider, for as long as that tab lives.

Three halves of one defect, and all three are required:

1. **Sync in three passes** — see "Only a hashed name may be cached forever" below.
   Hashed assets get a year and `immutable`, the stable names get `no-cache`, and
   `index.html` is never cached at all, because it is the only file naming the hashes
   `--delete` just removed. **Hashed assets first, stable names next, shell last**, so
   nothing is ever live before the chunks it names.
2. **Listen for `vite:preloadError`** (`src/helpers/chunkReload.ts`). Reloading is the fix
   rather than a retry, because the stale artefact is the `index.html` itself: the names this
   tab is asking for do not exist anywhere.
3. **Serve a missing asset as 404**, not as the SPA fallback. HTML with a 200 is parsed as a
   JavaScript module and reports `Unexpected token '<'`, which looks like a corrupt bundle
   rather than a file that is simply absent.

**The reload guard is not optional.** If the newly-fetched shell is also broken — a
half-finished sync, a CDN serving a mixed generation — an unconditional reload is an infinite
refresh loop, which is materially worse: the user cannot read an error, open devtools or
navigate away. So the first failure reloads once and records it in `sessionStorage`; a second
is left alone, `preventDefault` is **not** called, and the error propagates to the router's
`defaultErrorComponent` — a translated page with a way out, which is the correct end state
for a deployment that is genuinely broken.

## Only a hashed name may be cached forever

`Cache-Control: immutable, max-age=31536000` is a promise that this URL's bytes will never
change. It is only safe where the filename changes when the content does. In `dist/` that is
true of 439 of 445 files and false of six:

```
assets/**                     439 files, every one content-hashed
config-prod.json                stable name
favicon.ico                     stable name
index.html                      stable name
ki-bootstrap.js                 stable name
locales/**                      stable name
silent-renew.html               stable name
```

The single sync gave `immutable` to everything except `index.html`, so five stable names were
promised for a year.

**`ki-bootstrap.js` is the one that breaks the app**, and it breaks it the same way a stale
shell does. `vite.config.mts` pins its name on purpose — it is the bootloader's public entry
point, resolved by name from a host page — and it names the hashed chunks it loads. Cached
immutably, a host page keeps last release's bootloader for a year while `--delete` removes the
chunks it asks for. `src/helpers/chunkReload.ts` cannot recover this one: its reload re-fetches
the same immutable file.

The other four are quieter and the same mistake — a Spanish translation fix or a change to the
OIDC renewal page would not reach an existing user for a year.

So the sync is three passes:

| Pass | Selects                                                                   | `Cache-Control`                       |
| ---- | ------------------------------------------------------------------------- | ------------------------------------- |
| 1    | `--exclude "*" --include "assets/*"`                                      | `public, max-age=31536000, immutable` |
| 2    | `--exclude "assets/*" --exclude "index.html" --exclude "inject_env.json"` | `public, no-cache`                    |
| 3    | `index.html` alone, via `cp`                                              | `no-store, no-cache, must-revalidate` |

`no-cache` rather than a short `max-age`: it stores the file and revalidates against the ETag,
which is a 304 in the common case. A `max-age=300` would leave a five-minute window in which a
fresh `index.html` names chunks a stale `ki-bootstrap.js` cannot reach — the same failure, just
briefer. It is also not `no-store`, which would refetch all six on every load.

`--delete` stays on passes 1 and 2, whose union is the same key set the single pass deleted, so
this changes headers and nothing else. Verified against a real `dist/`: the three passes
partition all 445 files with no overlap and nothing uncovered, and every file in pass 1 carries
a hash.

**Contrast the R2 channel**, where `fe-bootloader`'s worker gives `immutable` to everything
except `/next/` and `latest.json` — correct there, because the key itself carries the version
(`/{app}/v2.0.0/…`). A flat `prod/dcb-admin/` prefix has no version in the path and cannot
borrow that header.

## Compression

`nginx:stable-alpine` ships gzip commented out in its http block, and the image replaces only
`conf.d/default.conf`, so the container served everything uncompressed. Measured on one
build:

```
one sign-in page load      1,576 KB raw  ->  665 KB gzipped
the whole asset directory  4,997 KB raw  ->  1,427 KB gzipped   (429 files)
```

2.4× the payload on a page load, and it survived because of where it sat: the Lighthouse
budget audits `vite preview`, which compresses, and Cloudflare compresses at the edge. Both
of the paths that are measured hid the one that is not.

`woff2` is deliberately absent from `gzip_types` — already compressed, and gzipping it spends
CPU to make the file marginally larger.

## Security headers

`docker/production/security-headers.conf`, included in the server block **and in every
location**.

**`add_header` does not merge across levels.** A `location` containing any `add_header` of
its own discards every one inherited from the enclosing server, and this config has four
locations that each set a `Cache-Control`. Headers declared once at server level would have
applied to nothing a browser actually fetches — not `index.html`, not `/assets/`, not
`inject_env.json` — while `nginx -t` reported the config as perfectly valid. That is why
they live in an included file, and why `src/helpers/nginxConfig.test.ts` asserts every
location includes it: the way they get lost is somebody adding a `/locales/` cache rule, not
somebody deleting them.

Three decisions worth keeping:

- **`frame-ancestors 'self'`, not `'none'`.** `'none'` is the reflex answer and it breaks
  authentication: oidc-client-ts renews the session in a hidden iframe pointed at this
  origin's own `silent-renew.html`, and `'none'` blocks same-origin framing too. Users would
  be signed out whenever their token expired, by a header added to make them safer.
- **`connect-src`/`frame-src` are `'self' https:`** rather than an enumeration, because the
  backends and the Keycloak realm are runtime configuration rendered per container and are
  unknowable when the file is written. Templating the policy through `envsubst` the way
  `inject_env.json` already is, is the follow-up.
- **`font-src` allows `data:`** because Vite inlines our own fonts. Roboto's Greek-Extended
  subsets are each under the 4KB `assetsInlineLimit`, so four weights × woff+woff2 become
  eight `data:` URIs. Without it the browser blocked all eight on every page load.

`/silent-renew.html` gets one relaxation, `script-src 'unsafe-inline'`, scoped to that one
location. It carries an inline `<script>` it cannot avoid — files in `public/` are served
verbatim and it cannot import oidc-client-ts to call `_notifyParent()`. A sha256 hash is the
textbook answer and is **wrong here**: the hash is over exact bytes, git stores the file LF
and hands a Windows checkout CRLF, so a hash computed on a developer's machine does not match
what a Linux CI job builds. That fails as a policy which passes review, passes locally, and
silently kills session renewal in production. The exception is bounded to one twenty-line
static file with no input, no interpolation and no imports.

**Verify against the running image, not the config.** A CSP failure is not a failed request
and not a thrown exception; `curl` cannot see one. Build the image, load it in a browser and
listen for `securitypolicyviolation`. That is how the font blocks above were found, after the
config test and `curl` had both passed.

## The version the artefact reports

`vite.config.mts` reads `package.json` at build time and bakes the version into the bundle
as `__APP_VERSION__`, which `Footer.tsx` renders. That is a **build-time** constant, unlike
everything in `inject_env.json`, so the artefact is only as accurate as the `package.json`
that was on disk when it was built.

semantic-release decides the version, and it runs in the `release` stage — _after_ the
`build` stage. So the artefact the pipeline shipped had always been built from the pre-bump
`package.json`, and every release to date named its predecessor in the footer:

```
package.json at release~1, i.e. what the build job saw while releasing 1.58.1   1.58.0
```

The archive prefix is derived separately, from `$RELEASE_VERSION` in the release job's dotenv
report, so `archive/dcb-admin-v1.58.1/` was at least named for the right release — assuming
that variable arrived at all, which the `dependencies` note below puts in doubt. The bundle
inside it said 1.58.0 either way.

`build_released_bundle` (stage `rebuild`, release branch only) is the fix: it `needs` the
release job, writes `$RELEASE_VERSION` into `package.json` with
`npm version --no-git-tag-version`, and builds again. `deploy_tag_to_s3` consumes that
artefact instead. The `build`-stage job still runs on the release branch, now purely as a
gate — nothing should be released that does not build — and its output is no longer deployed.

**`dependencies` overrides `needs` for downloads, and that matters here.** `deploy_tag_to_s3`
wants two things from two jobs: the bundle from `build_released_bundle` and
`$RELEASE_VERSION` from `release`'s dotenv. Setting `dependencies` at all makes it — not
`needs` — the list of jobs whose artefacts arrive, so the job now lists both in `needs` and
sets no `dependencies`.

### Why the gate reads a meta tag and not the bundle

`versionMetaPlugin` in `vite.config.mts` emits
`<meta name="dcb-admin-version" content="…">` into `index.html`, and the rebuild job asserts
that tag carries `$RELEASE_VERSION`.

The obvious gate — grep `dist/assets/` for the version — is **unsound**, and this was
measured rather than assumed. A fixed-string search for `9.9.9` passes against a bundle
built at 2.0.0, because it matches the SVG path fragment `.9c-.5 0-.9.4-.9.9v16.2` in an
icon chunk. A version number is three integers and two dots; so is a run of path
coordinates. A gate that can pass when the thing it checks is false is worse than no gate.

The tag earns its place twice over: it also means **what is deployed can be read with one
request**, `curl -s https://…/dcb-admin/index.html | grep dcb-admin-version`, rather than by
finding and opening a content-hashed JS chunk.

### `main` stays one release behind

`@semantic-release/git` commits the bumped `package.json` to the branch it released from,
and `.releaserc.json` sets `"branches": ["release"]`. Nothing carries that commit back, so
`main` reads the previous version indefinitely. Back-merge after each release:

```bash
git fetch origin
git checkout main
git merge --no-ff origin/release -m "chore: back-merge the <version> release commit [skip ci]"
git push origin main
```

`--no-ff` so `main` keeps its own history rather than fast-forwarding onto `release`, and
`[skip ci]` because a pipeline for a one-line version change is waste. This does not affect
what is deployed — `deploy_dev_to_s3` builds from `main` and its footer will simply name the
last release rather than an unreleased number.
