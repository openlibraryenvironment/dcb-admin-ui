import { useAuth } from "react-oidc-context";

import { isConsortiumStaff } from "@helpers/consortiumAccess";

/**
 * Whether this user may administer the consortium — W-4.
 *
 * <h2>Why a hook and not only a `beforeLoad` guard</h2>
 *
 * `beforeLoad` is the right place for a guard and the setup routes have one. It is not
 * sufficient on its own here: `context.auth` comes from react-oidc-context, which resolves
 * the stored session ASYNCHRONOUSLY. On a cold load - somebody pasting a URL, or opening a
 * bookmark - `beforeLoad` runs while `isAuthenticated` is still false, takes the
 * "not signed in yet, let __authenticated handle it" branch, and never sees the roles. The
 * guard then silently does nothing, which is the worst behaviour a guard can have.
 *
 * The e2e gate caught exactly that: a read-only user reached `/setup/consortium`.
 *
 * So the check is made twice, on purpose. `beforeLoad` redirects on the warm path (any
 * in-app navigation), and this decides what the component renders on the cold one. It is
 * NOT the "render the protected page then redirect in an effect" anti-pattern - the
 * protected content is never rendered at all, and nothing navigates from an effect.
 *
 * Neither of these is the real control. The real control is dcb-service's `@Secured`
 * annotations on the mutations these chapters call; this is what stops a user being shown
 * a form whose save can only fail.
 */
export function useIsConsortiumAdmin(): boolean {
	const auth = useAuth();

	return isConsortiumStaff(auth?.user?.profile?.roles as string[] | undefined);
}
