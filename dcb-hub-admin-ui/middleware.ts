// export { default } from "next-auth/middleware"

import { withAuthProvider } from './middlewares/withAuthorization';
export default withAuthProvider('keycloak');

// See https://next-auth.js.org/configuration/nextjs
//

// Secure only specific paths with
// export const config = { matcher: ["/dashboard"] }
// https://nextjs.org/docs/advanced-features/middleware#matcher

export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - api (API routes)
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 */
		'/((?!api|_next/static|_next/image|favicon.ico).*)'
	],
	unstable_allowDynamic: ['**/@babel/runtime/regenerator/index.js']
};
