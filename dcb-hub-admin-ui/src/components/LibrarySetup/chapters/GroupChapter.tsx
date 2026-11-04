import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { FormProvider } from "react-hook-form";
import { Alert } from "@mui/material";

import SetupFooter from "@components/Setup/SetupFooter";
import GroupStep from "@forms/NewLibrary/steps/GroupStep";
import {
	existingGroupIds,
	formValuesFromLibrary,
} from "@forms/NewLibrary/libraryPayloads";
import { useGraphQLClient } from "@hooks/useGraphQLClient";
import {
	consortiumBasicsQuery,
	readConsortiumPresence,
} from "@/queryOptions/consortium";
import { describeGraphQLError } from "@helpers/graphQLErrors";
import { useLibraryChapterForm } from "../useLibraryChapterForm";
import { useLibrarySetupWrites } from "../useLibrarySetupWrites";
import type { LibraryChapterProps } from "./chapterProps";

/** "Which groups is it part of?" The consortium's own group always, then any chosen. */
export default function GroupChapter({
	library,
	onNext,
	onBack,
}: LibraryChapterProps) {
	const { t } = useTranslation();
	const gqlClient = useGraphQLClient();
	const writes = useLibrarySetupWrites();
	const [error, setError] = useState<string | null>(null);
	const { consortiumGroup } = readConsortiumPresence(
		useQuery(consortiumBasicsQuery(gqlClient)),
	);
	const memberOf = existingGroupIds(library);
	const inConsortium =
		!!consortiumGroup && memberOf.includes(consortiumGroup.id);
	const { methods, validate, markSaved } = useLibraryChapterForm(
		"group",
		formValuesFromLibrary(library),
		["groupId"],
	);

	const onContinue = async () => {
		setError(null);
		if (!(await validate())) return;
		const { groupId } = methods.getValues();

		try {
			if (consortiumGroup && !inConsortium) {
				await writes.joinGroup.mutateAsync({
					groupId: consortiumGroup.id,
					libraryId: library.id,
				});
			}
			if (
				groupId &&
				groupId !== consortiumGroup?.id &&
				!memberOf.includes(groupId)
			) {
				await writes.joinGroup.mutateAsync({ groupId, libraryId: library.id });
			}
			markSaved(methods.getValues());
			onNext();
		} catch (caught) {
			setError(describeGraphQLError(caught, t("ui.error.general")));
		}
	};

	return (
		<>
			<FormProvider {...methods}>
				<form noValidate aria-busy={writes.busy}>
					<GroupStep
						consortiumGroup={consortiumGroup}
						isInConsortiumGroup={inConsortium}
					/>
				</form>
			</FormProvider>
			{error && (
				<Alert severity="error" role="alert" sx={{ mt: 2 }}>
					{error}
				</Alert>
			)}
			<SetupFooter
				onBack={onBack}
				onContinue={() => void onContinue()}
				busy={writes.busy}
			/>
		</>
	);
}
