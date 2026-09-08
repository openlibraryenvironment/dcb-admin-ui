import { useTranslation } from "react-i18next";

import Loading from "@components/Loading/Loading";

/**
 * What a route shows while its loader is still running.
 *
 * Wired as the router's `defaultPendingComponent`, so it covers every route rather than
 * the three that remembered to declare one. It only appears once a loader has been running
 * for `defaultPendingMs` (1s), which is why a centred spinner is the right shape here and a
 * dimension-matched skeleton is not: by the time this renders the navigation is already
 * slow enough that the user needs to be told something is happening, and there is no single
 * layout to match across 84 routes.
 */
export default function RoutePending() {
	const { t } = useTranslation();

	return <Loading title={t("common.loading")} subtitle={t("ui.info.wait")} />;
}
