import { configureAppBase } from "@helpers/appBase";

interface KiMountOptions {
	element: HTMLElement;
	config: Record<string, unknown>;
}

export async function mount({
	element,
	config,
}: KiMountOptions): Promise<void> {
	window.__DCB_BUNDLE_BASE_URL__ = new URL(
		".",
		/* @vite-ignore */ import.meta.url,
	).href;
	configureAppBase("/");
	const { mountDcbAdmin } = await import("./application");
	await mountDcbAdmin(element, config as Record<string, string | undefined>);
}
