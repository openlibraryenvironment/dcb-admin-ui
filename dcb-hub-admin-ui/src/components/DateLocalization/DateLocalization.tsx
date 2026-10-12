import type { ReactNode } from "react";
// eslint-disable-next-line no-restricted-imports -- this is the one provider
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

import { useLocaleStore } from "@hooks/useLocaleStore";
import {
	DAYJS_LOCALES,
	deploymentLocale,
	resolveFormatLocale,
} from "@helpers/locale";

/**
 * Every date picker's provider, so all of them read the same date order and first
 * weekday. Wrapped around each picker rather than the app: the adapter and its dayjs
 * plugins would otherwise load on every page, the sign-in page included.
 */
export default function DateLocalization({
	children,
}: {
	children: ReactNode;
}) {
	const choice = useLocaleStore((s) => s.choice);
	return (
		<LocalizationProvider
			dateAdapter={AdapterDayjs}
			adapterLocale={
				DAYJS_LOCALES[resolveFormatLocale(choice, deploymentLocale())]
			}
		>
			{children}
		</LocalizationProvider>
	);
}
