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

| Variable                                 | Enable at dcb-service                 | What it turns on                                                                                                                              |
| ---------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_FEATURE_CONSORTIUM_BRANDING`       | **9.0.0** or later                    | The consortium Branding tab, the setup wizard's Discovery chapter, brand image upload, and the merged brand columns in the consortium queries |
| `VITE_FEATURE_NCIP_ONBOARDING`           | **9.0.0** or later                    | Service Info → DCB NCIP onboarding (`/api/v1/dcb-profile-ncip2`)                                                                              |
| `VITE_FEATURE_INSIGHTS`                  | **9.0.0** or later                    | Insights, consortium- and library-level (`/insights`)                                                                                         |
| `VITE_FEATURE_LIBRARY_USER_PROVISIONING` | **dcb-service main** — no release yet | A library's Accounts tab: inviting, enabling and re-inviting DCB Admin for Libraries users                                                    |
| `VITE_FEATURE_LOCAL_HOLDS`               | **dcb-service main** — no release yet | The per-agency maximum local holds field on a library's Settings tab                                                                          |
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

### Option A: Cloudflare Worker in front of S3

**Architecture:** CI builds each app and syncs it to its own key prefix in a shared S3 bucket. A single Cloudflare Worker ([docs/worker.js](./worker.js)) sits in front, mounting each app at a path prefix on every domain and supplying its environment-specific config at runtime via `<base>inject_env.json`:

```
mobius.kihosting.net/dcb-admin                -> s3://<bucket>/dcb-admin/
mobius.kihosting.net/dcb-admin-for-libraries  -> s3://<bucket>/dcb-admin-for-libraries/
```

The URL path maps 1:1 onto the S3 key, so the worker does no asset-path rewriting.

**"Build once, deploy anywhere" holds across _hostnames_, never across _base paths_.** The backends, Keycloak client and licence key are runtime config and vary by host, so one artifact serves every environment at a given mount point. The base path is not runtime config — it is baked in by Vite — so each mount point needs its own build. That costs nothing, since the apps are separate builds anyway.

**Deployment Steps:**

1. Build each app with its mount point as the base, and sync it to the matching key prefix:

   ```bash
   VITE_PUBLIC_URL=/dcb-admin/ npm run build
   aws s3 sync dist/ s3://<bucket>/dcb-admin/ --delete
   ```

   Keep `--delete` scoped to the prefix. Against the bucket root it will wipe the sibling apps.

2. Set the environment variables from Section 2 on the Worker (Settings → Variables), keyed per environment as `hostConfig()` in the worker expects.
3. Deploy the worker with `wrangler deploy`.
4. Point traffic at it in the Cloudflare dashboard:
   - **Routes** (`mobius.kihosting.net/dcb-admin*`) if the hostname also serves anything else — a route only claims matching paths.
   - **A Custom Domain** if the hostname is dedicated to these apps; it claims the whole host and creates the DNS record for you.
   - Routes require an existing **proxied (orange-cloud)** DNS record for the hostname. A grey-cloud record bypasses Workers entirely, and the usual symptom is that nothing you deploy appears to take effect.
5. Update Keycloak's Valid Redirect URIs to include each subpath (Section 1, step 12).

**Adding another app:** add its prefix to `APPS` and a case to `appConfig()` in the worker, then point its CI at the matching S3 key prefix. Nothing else changes.

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

1. **Sync in two passes.** Hashed filenames are content-addressed, so they get a year and
   `immutable`; `index.html` can never be cached, because it is the only file naming the
   hashes `--delete` just removed. **Assets first, shell last**, so a new shell is never live
   before the chunks it names.
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
