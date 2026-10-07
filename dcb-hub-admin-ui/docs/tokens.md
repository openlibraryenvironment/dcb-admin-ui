# Where tokens live

One decision, recorded because the frontend doctrine asks for exactly one and this
repository had it only as a line of configuration. Nothing here changes behaviour;
it states what the behaviour is and what would have to be true to change it.

## The decision

`oidc-client-ts` keeps the signed-in user — **including the access and refresh
tokens** — in `window.localStorage`, set explicitly in `application.tsx`:

```ts
userStore: new WebStorageStateStore({ store: window.localStorage }),
```

Keyed `oidc.user:${authority}:${client_id}`, so two OpenRS apps on one origin do not
collide and a build whose authority differs from the one that signed in simply finds
no user.

## What that buys

A session survives a tab close, a browser restart and a crash. For a staff console
this is the behaviour people expect: an administrator who closes the window at lunch
and reopens it is still signed in. `sessionStorage` would end the session with the
tab, and in-memory storage would end it with a refresh — on a console whose forms are
long, that is a data-loss mechanism as well as an annoyance.

It is also what makes `automaticSilentRenew` work across tabs: the hidden renewal
iframe (`silent-renew.html`) writes the renewed user back to the same store, and every
tab reads it.

## What it costs, and what carries the risk instead

`localStorage` is readable by any script that runs on the origin. So the controls that
actually matter are the ones that stop a script running there, and the ones that bound
the token's usefulness:

| Control                                                                            | Where                                   |
| ---------------------------------------------------------------------------------- | --------------------------------------- |
| No untrusted HTML is ever rendered; `react/no-danger` is an error                  | `eslint.config.mjs`                     |
| No new runtime dependency without a licence and supply-chain check                 | `CONTRIBUTING.md`, renovate             |
| Secret scanning over full history, new findings fail the pipeline                  | `verify_secrets`, `.gitleaks.toml`      |
| 30-minute idle sign-out, with a one-minute warning, synchronised across tabs       | `routes/__authenticated.tsx`            |
| Refresh tokens revoked at the IdP on sign-out (`revokeTokensOnSignout`)            | `application.tsx`                       |
| Sign-out clears every namespaced key in both stores                                | `clearAppStorage`, `helpers/appBase.ts` |
| Identity is never read from client input; the server re-derives it from the bearer | `dcb-service`                           |

The last one is the important one: a stolen token is bounded by its lifetime and by
what the IdP granted it, and no authority in this application comes from anything the
client stores. Hiding a button is UX, not security, and nothing here relies on it.

## What would change the decision

Any of these, and this file should be rewritten rather than appended to:

- **A rendering path for untrusted markup.** Catalogue metadata genuinely carrying
  HTML would mean sanitising at the boundary, and the risk calculus above moves.
- **A longer-lived refresh token.** The current posture assumes the IdP's lifetimes
  are short enough that revocation plus a 30-minute idle timeout is the real bound.
  If a deployment lengthens them, `sessionStorage` becomes the better trade.
- **A deployment that cannot be trusted to be the only app on its origin.** Storage
  is per-origin, not per-path: `getAppNamespace()` keeps the _keys_ apart so sibling
  apps do not overwrite each other, but it is not a security boundary and must not be
  read as one.

Moving the store is not a free change: every signed-in administrator is signed out at
the moment it deploys, because the key they hold is in the store the new build no
longer reads. That is the reason this is a record and not a patch.
