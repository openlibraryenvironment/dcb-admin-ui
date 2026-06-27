import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

export const config = {
	matcher: [
		"/",
		"/((?!api|dcb-api|auth/login|auth/logout|_next|favicon.ico).*)",
	],
};

const localeFromPath = (path: string) =>
	path.match(/^\/(en-GB|en-US)(?=\/|$)/)?.[1];

const stripLocale = (path: string) =>
	path.replace(/^\/(en-GB|en-US)(?=\/|$)/, "") || "/";

const callbackPathFor = (path: string, search: string) => {
	const strippedPath = stripLocale(path);

	if (
		strippedPath.startsWith("/auth/") ||
		strippedPath.startsWith("/api/") ||
		strippedPath.startsWith("/_next/")
	) {
		return "/";
	}

	return path + search;
};

export default async function middleware(req: any) {
	const path = stripLocale(req.nextUrl.pathname);

	if (path === "/auth/login" || path === "/auth/logout") {
		return NextResponse.next();
	}

	const token = (await getToken({
		req,
		secret: process.env.NEXTAUTH_SECRET,
		secureCookie:
			req.nextUrl.protocol === "https:" ||
			req.headers.get("x-forwarded-proto") === "https" ||
			process.env.NEXTAUTH_URL?.startsWith("https://") === true,
	})) ?? (await getToken({
		req,
		secret: process.env.NEXTAUTH_SECRET,
		secureCookie: false,
	}));

	if (path === "/__middleware-auth-debug") {
		return NextResponse.json({
			cookieNames: req.cookies
				.getAll()
				.map((cookie: { name: string }) => cookie.name)
				.filter((name: string) => name.includes("next-auth")),
			hasToken: Boolean(token),
			path: req.nextUrl.pathname,
			protocol: req.nextUrl.protocol,
			forwardedProto: req.headers.get("x-forwarded-proto"),
		});
	}

	if (!token) {
		const signInUrl = req.nextUrl.clone();
		const locale = localeFromPath(req.nextUrl.pathname);
		signInUrl.pathname = locale ? `/${locale}/auth/login` : "/auth/login";
		signInUrl.search = "";
		signInUrl.searchParams.set(
			"callbackUrl",
			callbackPathFor(req.nextUrl.pathname, req.nextUrl.search),
		);

		const response = NextResponse.redirect(signInUrl);
		response.headers.set("x-dcb-admin-redirect-reason", "missing-session");
		return response;
	}

	const userRoles = (token as any)?.profile?.roles || [];
	const adminOnlyRoutes = [
		"/serviceInfo/dataChangeLog",
		"/api/persistentAssets/imageUpload",
	];
	const adminRoles = ["ADMIN", "CONSORTIUM_ADMIN"];

	if (adminOnlyRoutes.some((route) => path.startsWith(route))) {
		if (!userRoles.some((role: string) => adminRoles.includes(role))) {
			return NextResponse.redirect(new URL("/unauthorised", req.url));
		}
	}

	return NextResponse.next();
}
