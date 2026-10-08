import { useTranslation } from "react-i18next";
import { ErrorComponentProps, useRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import PageContainer from "@layout/PageContainer/PageContainer";
import Error from "@components/Error/Error";
import { capitaliseFirstCharacter } from "@helpers/capitaliseFirstCharacter";

export function NotFound() {
	const { t } = useTranslation();
	return (
		<PageContainer title={t("ui.error.404.name")} hideTitleBox hideBreadcrumbs>
			<Error
				title={t("ui.error.404.name")}
				message={t("ui.error.404.summary")}
				description={t("ui.error.404.description")}
				action={capitaliseFirstCharacter(t("ui.error.404.action"))}
				goBack="/"
			/>
		</PageContainer>
	);
}

export function GlobalError({ error, reset }: ErrorComponentProps) {
	const { t } = useTranslation();
	const router = useRouter();
	const queryClient = useQueryClient();
	console.error("Global crash caught by TanStack:", error);

	/**
	 * Recover the page rather than leave it.
	 *
	 * `reset()` alone re-renders the boundary's children, and a query still holding a
	 * rejected result throws again on that render - so the errored entries are cleared
	 * first. resetQueries refetches the active ones, which is the retry.
	 *
	 * Only the entries that failed: a bare reset would discard the whole cache and
	 * re-fire every mounted query, which is the stampede `invalidateQueries()` with no
	 * key was removed for.
	 */
	const retry = () => {
		void queryClient.resetQueries({
			predicate: (query) => query.state.status === "error",
		});
		reset();
		void router.invalidate();
	};

	return (
		<PageContainer hideBreadcrumbs>
			<Error
				title={t("ui.error.500.name")}
				message={t("ui.error.500.summary")}
				description={t("ui.error.500.retry_hint")}
				action={t("ui.actions.try_again")}
				onAction={retry}
				secondary={{
					label: t("ui.actions.go_back"),
					onClick: () => router.navigate({ to: "/" }),
				}}
			/>
		</PageContainer>
	);
}
