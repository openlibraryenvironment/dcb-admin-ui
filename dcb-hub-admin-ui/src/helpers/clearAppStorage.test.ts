import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
	clearAppStorage,
	getAppNamespace,
	postLoginRedirectKey,
	storageKey,
} from "./appBase";

// A Storage stand-in whose data keys are the only ENUMERABLE own properties,
// so Object.keys() sees what it sees on a real Storage: the stored keys, not
// the methods.
const makeStorage = () => {
	const data: Record<string, string> = {};
	Object.defineProperties(data, {
		getItem: { value: (k: string) => data[k] ?? null },
		setItem: {
			value: (k: string, v: string) => {
				data[k] = v;
			},
		},
		removeItem: {
			value: (k: string) => {
				delete data[k];
			},
		},
	});
	return data as unknown as Storage & Record<string, string>;
};

let local: ReturnType<typeof makeStorage>;
let session: ReturnType<typeof makeStorage>;

beforeEach(() => {
	local = makeStorage();
	session = makeStorage();
	vi.stubGlobal("localStorage", local);
	vi.stubGlobal("sessionStorage", session);
});

afterEach(() => {
	vi.unstubAllGlobals();
});

describe("clearAppStorage", () => {
	it("drops this app's persisted stores from BOTH web storages", () => {
		// Theme, sidebar and cost live in localStorage...
		local.setItem(storageKey("dcb-admin-theme"), '{"themeName":"openRS"}');
		local.setItem(storageKey("sidebar-storage"), '{"sidebarOpen":false}');
		local.setItem(storageKey("dcb-insights-ill-cost"), '{"illUnitCost":12}');
		// ...grid filters and service info in sessionStorage.
		session.setItem(storageKey("grid-storage"), '{"filterModel":{}}');
		session.setItem(storageKey("dcb-version-storage"), '{"version":"1.0"}');

		clearAppStorage();

		expect(Object.keys(local)).toEqual([]);
		expect(Object.keys(session)).toEqual([]);
	});

	it("keeps consortium branding, which the logout page still renders", () => {
		const branding = storageKey("consortium-storage");
		local.setItem(branding, '{"displayName":"MOBIUS"}');
		local.setItem(storageKey("dcb-admin-theme"), '{"themeName":"openRS"}');

		clearAppStorage();

		expect(local.getItem(branding)).toBe('{"displayName":"MOBIUS"}');
		expect(Object.keys(local)).toEqual([branding]);
	});

	it("still clears the post-login redirect, which is transient, not a preference", () => {
		session.setItem(postLoginRedirectKey(), "/libraries");

		clearAppStorage();

		expect(session.getItem(postLoginRedirectKey())).toBeNull();
	});

	it("namespaces the post-login redirect key so sibling apps cannot collide", () => {
		expect(postLoginRedirectKey()).toBe(
			`${getAppNamespace()}:postLoginRedirectPath`,
		);
	});

	it("leaves a sibling app's state on the shared origin alone", () => {
		// The whole reason this is not a storage.clear().
		local.setItem("dcb-admin-for-libraries:dcb-admin-theme", '{"mode":"dark"}');
		session.setItem("openrs-reconnoitre:grid-storage", "{}");
		local.setItem(storageKey("dcb-admin-theme"), '{"mode":"light"}');

		clearAppStorage();

		expect(Object.keys(local)).toEqual([
			"dcb-admin-for-libraries:dcb-admin-theme",
		]);
		expect(Object.keys(session)).toEqual(["openrs-reconnoitre:grid-storage"]);
	});

	it("leaves the OIDC user entry alone - removeUser/signoutRedirect retire that", () => {
		const oidcKey = "oidc.user:https://keycloak.example/realms/dcb:admin-ui";
		local.setItem(oidcKey, '{"access_token":"x"}');

		clearAppStorage();

		expect(local.getItem(oidcKey)).toBe('{"access_token":"x"}');
	});

	it("removes every namespaced key, not just the first", () => {
		// Guards the delete-while-iterating trap: Object.keys() must be snapshotted
		// before removal or alternate entries survive.
		for (let i = 0; i < 10; i++) {
			local.setItem(`${getAppNamespace()}:key-${i}`, String(i));
		}

		clearAppStorage();

		expect(Object.keys(local)).toEqual([]);
	});
});
