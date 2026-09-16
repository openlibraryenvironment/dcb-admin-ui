import { createContext, useContext } from "react";

/**
 * What every exported file has to say about itself.
 *
 * A context rather than a prop threaded through fourteen panels: the scope and the window
 * are properties of the VIEW, not of any panel, and every panel that exports needs the same
 * two strings. Adding them to each panel's signature would put the same two arguments on
 * every call site and leave the next panel's author to decide whether to pass them.
 *
 * The context and its hook live here rather than beside the provider component so that file
 * exports only components - see the react-refresh rule.
 */

export interface ExportContextValue {
	/** Which libraries the figures cover, in the reader's words. */
	scope: string;
	/** The window, in the reader's words. */
	window: string;
}

export const ExportContext = createContext<ExportContextValue | null>(null);

/**
 * Null outside a dashboard, and a panel rendered there simply does not offer an export -
 * better than a file that states a scope nobody set.
 */
export const useExportContext = () => useContext(ExportContext);
