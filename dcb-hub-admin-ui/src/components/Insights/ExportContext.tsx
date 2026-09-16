import { ReactNode } from "react";

import { ExportContext, ExportContextValue } from "@helpers/insightsExport";

/**
 * Composed once, where the live region already composes the same words, so an exported file
 * and the announcement cannot disagree about what is on screen.
 */
export function InsightsExportProvider({
	value,
	children,
}: {
	value: ExportContextValue;
	children: ReactNode;
}) {
	return (
		<ExportContext.Provider value={value}>{children}</ExportContext.Provider>
	);
}
