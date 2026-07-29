import { configureAppBase } from "@helpers/appBase";

async function startStandalone(): Promise<void> {
	configureAppBase(import.meta.env.BASE_URL);
	const { getStandaloneConfig, mountDcbAdmin } = await import("./application");

	const rootElement = document.getElementById("root");
	if (!rootElement) {
		throw new Error("DCB Admin root element is missing");
	}

	const config = await getStandaloneConfig();
	await mountDcbAdmin(rootElement, config);
}

void startStandalone();
