import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FormProvider, useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert, AlertTitle, LinearProgress, Stack } from "@mui/material";

import FunctionalSettingsFields from "@forms/ConsortiumSetup/steps/FunctionalSettingsFields";
import SetupFooter from "../SetupFooter";
import { useSetupNavigation } from "@hooks/useSetupNavigation";
import { useConsortiumSetup } from "@hooks/useConsortiumSetup";
import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { describeGraphQLError } from "@helpers/graphQLErrors";
import { addFunctionalSettingMutation } from "@mutations/addFunctionalSetting";
import { updateFunctionalSettingQuery } from "@mutations/updateFunctionalSetting";
import {
	CONSORTIUM_FUNCTIONAL_SETTINGS,
	storedDescription,
} from "@constants/functionalSettings";
import type { NewConsortiumFormValues } from "@schemas/newConsortiumSchema";
import type {
	AddFunctionalSettingMutation,
	AddFunctionalSettingMutationVariables,
	UpdateFunctionalSettingMutation,
	UpdateFunctionalSettingMutationVariables,
} from "@generated/graphql";
import { useRegisterSetupDirty } from "../setupRun";

/**
 * C3 — "How should requesting work?"
 *
 * Runs AFTER the consortium exists, because commit-early wrote it with an empty settings
 * list. So this chapter uses the ordinary mutations the functional settings page already
 * uses rather than a create-time payload: `createFunctionalSetting` for a setting the
 * consortium does not have, `updateFunctionalSetting` for one it does.
 *
 * That split is what makes the chapter re-enterable. Coming back and changing an answer is
 * the same code path as answering it the first time, which is the property that lets this
 * become a tab under Consortium once setup is finished.
 *
 * <h2>Scale</h2>
 *
 * The write is one request per CHANGED setting, over a list of at most
 * `CONSORTIUM_FUNCTIONAL_SETTINGS.length` - a fixed vocabulary of six, not a corpus-scaled
 * or member-scaled number. Unchanged settings are not rewritten, so the common revisit
 * costs nothing at all.
 */
export default function HowItWorksChapter() {
	const { t } = useTranslation();
	const gqlClient = useGraphQLClient();
	const queryClient = useQueryClient();
	const { goNext, goBack, skipAndContinue } = useSetupNavigation("howItWorks");
	const { consortium } = useConsortiumSetup();

	const [error, setError] = useState<string | null>(null);
	const [isBusy, setBusy] = useState(false);
	const isSubmitting = useRef(false);

	// What the consortium currently has, by setting name. Only the settings this screen
	// offers are considered; anything else the consortium carries is left alone.
	const existing = useMemo(() => {
		const byName = new Map<string, { id: string; enabled: boolean }>();
		for (const setting of consortium?.functionalSettings ?? []) {
			if (setting?.name)
				byName.set(setting.name, {
					id: setting.id,
					enabled: setting.enabled === true,
				});
		}
		return byName;
	}, [consortium]);

	const methods = useForm<Pick<NewConsortiumFormValues, "functionalSettings">>({
		mode: "onTouched",
		defaultValues: {
			// Seeded from what is stored, falling back to each setting's own default.
			// Re-entering the chapter has to show the consortium's current answers, not
			// the shipped ones, or saving would silently revert somebody's changes.
			functionalSettings: Object.fromEntries(
				CONSORTIUM_FUNCTIONAL_SETTINGS.map((setting) => [
					setting.name,
					existing.get(setting.name)?.enabled ?? setting.defaultEnabled,
				]),
			),
		},
	});

	// Tells the layout there is unsaved work here, so leaving the chapter asks first.
	useRegisterSetupDirty("howItWorks", methods.formState.isDirty);

	const { mutateAsync: save } = useMutation({
		mutationFn: async (selection: Record<string, boolean>) => {
			for (const setting of CONSORTIUM_FUNCTIONAL_SETTINGS) {
				const wanted = selection[setting.name] === true;
				const current = existing.get(setting.name);

				if (!current) {
					await gqlClient.request<
						AddFunctionalSettingMutation,
						AddFunctionalSettingMutationVariables
					>(addFunctionalSettingMutation, {
						input: {
							name: setting.name,
							enabled: wanted,
							// The same sentence the user just read, trimmed to the
							// column - so the settings page says the same thing a year
							// from now.
							description: storedDescription(t(setting.descriptionKey)),
							consortiumName: consortium?.name,
							reason: "Initial setup",
							changeCategory: "Initial setup",
						},
					});
					continue;
				}

				// Nothing to say to the server about a setting nobody changed.
				if (current.enabled === wanted) continue;

				await gqlClient.request<
					UpdateFunctionalSettingMutation,
					UpdateFunctionalSettingMutationVariables
				>(updateFunctionalSettingQuery, {
					input: {
						id: current.id,
						enabled: wanted,
						reason: "Initial setup",
						changeCategory: "Initial setup",
					},
				});
			}
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["LoadConsortium"] });
			queryClient.invalidateQueries({
				queryKey: ["LoadConsortiumFunctionalSettings"],
			});
		},
	});

	const handleContinue = async () => {
		if (isSubmitting.current) return;
		isSubmitting.current = true;
		setBusy(true);
		setError(null);
		try {
			await save(methods.getValues().functionalSettings);
			// Settle the form against what was just saved BEFORE navigating. Without this
			// the values are still "dirty" relative to the defaults, so the layout's
			// unsaved-work guard fires on the flow's OWN Continue - warning the user they
			// are about to lose work that has this moment been written to the server.
			methods.reset(methods.getValues());
			goNext();
		} catch (failure: any) {
			console.error("Functional settings save failed:", failure);
			setError(describeGraphQLError(failure, t("setup.how_it_works.error")));
		} finally {
			setBusy(false);
			isSubmitting.current = false;
		}
	};

	return (
		<Stack spacing={2}>
			<div style={{ height: 4 }}>{isBusy && <LinearProgress />}</div>

			{error && (
				<Alert severity="error" role="alert" onClose={() => setError(null)}>
					<AlertTitle>{t("setup.how_it_works.error")}</AlertTitle>
					{error}
				</Alert>
			)}

			<FormProvider {...(methods as any)}>
				<FunctionalSettingsFields showExplanation={false} />
			</FormProvider>

			<SetupFooter
				onBack={goBack}
				onContinue={handleContinue}
				continueLabel={t("setup.actions.save_and_continue")}
				onSkip={skipAndContinue}
				busy={isBusy}
			/>
		</Stack>
	);
}
