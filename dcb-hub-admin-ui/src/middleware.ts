import { withAuth } from "next-auth/middleware";

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
export default withAuth({
	pages: {
	  signIn: "/auth/login",
	  signOut: "/auth/logout"
	},
});
