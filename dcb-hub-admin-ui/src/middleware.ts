import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// The matcher has been commented out because we are currently securing all routes. If that changes, we will need to re-visit this file.
// Matcher documentation can be found here and an example is below https://nextjs.org/docs/advanced-features/middleware#matcher
// export const config = {
// 	matcher: [
// 		/*
// 		 * Match all request paths except for the ones starting with:
// 		 * - api (API routes)
// 		 * - _next/static (static files)
// 		 * - _next/image (image optimization files)
// 		 * - favicon.ico (favicon file)
// 		 */
// 		'/((?!api|_next/static|_next/image|favicon.ico).*)'
// 	]
// };

// We define the routes to our login and logout pages here. They must match the routes defined in [...nextauth].ts
// Refer to https://next-auth.js.org/configuration/nextjs#middleware to understand what the role of this file is.
export default withAuth(
	function middleware(req) {
		const token = req.nextauth.token;
		const path = req.nextUrl.pathname;
		// Get the request, get the roles, and figure out where it's going
		const userRoles = token?.profile?.roles || [];

		const adminOnlyRoutes = ["/serviceInfo/dataChangeLog"];
		const adminRoles = ["ADMIN", "CONSORTIUM_ADMIN"];
		// And if it's going to an admin only route and doesn't have the correct role, stop it.
		// This is where we define route and role groupings.

		if (adminOnlyRoutes.some((route) => path.startsWith(route))) {
			if (!userRoles.some((role) => adminRoles.includes(role))) {
				return NextResponse.redirect(new URL("/unauthorised", req.url));
			}
		}

		// For any other routes, allow access to authenticated users.
		return NextResponse.next();
	},
	{
		pages: {
			signIn: "/auth/login",
			signOut: "/auth/logout",
		},
	},
);
