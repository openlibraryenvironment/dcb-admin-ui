import type { NextMiddleware, NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { JWT } from 'next-auth/jwt';
import { getToken } from 'next-auth/jwt';
import type {
	NextAuthMiddlewareOptions,
	NextMiddlewareWithAuth,
	WithAuthArgs
} from 'next-auth/middleware';
import { BuiltInProviderType, RedirectableProviderType } from 'next-auth/providers';
import { getCsrfToken } from 'next-auth/react';
import { LiteralUnion } from 'next-auth/react/types';

async function hash(value: string): Promise<string> {
	const encoder = new TextEncoder();
	const data = encoder.encode(value);
	const hash = await crypto.subtle.digest('SHA-256', data);
	const hashArray = Array.from(new Uint8Array(hash));
	return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

interface AuthMiddlewareOptions extends NextAuthMiddlewareOptions {
	trustHost?: boolean;
}

async function handleMiddleware(
	req: NextRequest,
	options: (AuthMiddlewareOptions & { provider?: string }) | undefined = {},
	onSuccess?: (token: JWT | null) => ReturnType<NextMiddleware>
) {
	const { origin, basePath } = req.nextUrl;
	const errorPage = options?.pages?.error ?? '/api/auth/error';

	options.trustHost ??= !!(
		process.env.NEXTAUTH_URL ??
		process.env.VERCEL ??
		process.env.AUTH_TRUST_HOST
	);

	const host =
		process.env.NEXTAUTH_URL ?? req.headers?.get('x-forwarded-host') ?? 'http://localhost:3000';

	options.secret ??= process.env.NEXTAUTH_SECRET;
	if (!options.secret) {
		console.error(`[next-auth][error][NO_SECRET]`, `\nhttps://next-auth.js.org/errors#no_secret`);

		const errorUrl = new URL(`${basePath}${errorPage}`, origin);
		errorUrl.searchParams.append('error', 'Configuration');

		return NextResponse.redirect(errorUrl);
	}

	const token = await getToken({
		req,
		decode: options.jwt?.decode,
		cookieName: options?.cookies?.sessionToken?.name,
		secret: options.secret
	});

	const isAuthorized = (await options?.callbacks?.authorized?.({ req, token })) ?? !!token;

	if (isAuthorized) return onSuccess?.(token);

	const cookieCsrfToken = req.cookies.get('next-auth.csrf-token')?.value;
	const csrfToken = cookieCsrfToken?.split('|')?.[0] ?? (await getCsrfToken()) ?? '';
	const csrfTokenHash =
		cookieCsrfToken?.split('|')?.[1] ?? (await hash(`${csrfToken}${options.secret}`));
	const cookie = `${csrfToken}|${csrfTokenHash}`;

	const res = await fetch(`${host}/api/auth/signin/${options.provider ?? ''}`, {
		method: 'post',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'X-Auth-Return-Redirect': '1',
			cookie: `next-auth.csrf-token=${cookie}`
		},
		credentials: 'include',
		redirect: 'follow',
		body: new URLSearchParams({
			csrfToken,
			// Modified from the original middleware as redirect did not seem to work for me with req.url
			callbackUrl: req.nextUrl.pathname + req.nextUrl.search,
			// callbackUrl: req.url,
			json: 'true'
		})
	});

	const data = (await res.json()) as { url: string };

	return NextResponse.redirect(data.url, {
		headers: {
			'Set-Cookie': res.headers.get('set-cookie') ?? ''
		}
	});
}

export declare type WithAuthProviderArgs = [
	...(WithAuthArgs &
		[
			{
				provider: LiteralUnion<RedirectableProviderType | BuiltInProviderType>;
			}
		])
];

export function withAuth(...args: WithAuthProviderArgs) {
	if (!args.length || args[0] instanceof Request) {
		return handleMiddleware(...(args as Parameters<typeof handleMiddleware>));
	}

	if (typeof args[0] === 'function') {
		const middleware = args[0];
		const options = args[1] as NextAuthMiddlewareOptions | undefined;
		return async (...args: Parameters<NextMiddlewareWithAuth>) =>
			await handleMiddleware(args[0], options, async (token) => {
				args[0].nextauth = { token };
				return await middleware(...args);
			});
	}

	const options = args[0];
	return async (...args: Parameters<NextMiddleware>) => await handleMiddleware(args[0], options);
}

export function withAuthProvider(
	provider: LiteralUnion<RedirectableProviderType | BuiltInProviderType>,
	...args: WithAuthArgs
) {
	return withAuth({ ...args, provider });
}
