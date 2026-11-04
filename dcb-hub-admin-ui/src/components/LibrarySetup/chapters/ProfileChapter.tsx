import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { FormProvider } from "react-hook-form";
import { Alert, Skeleton } from "@mui/material";

import SetupFooter from "@components/Setup/SetupFooter";
import { ProfileStep } from "@forms/NewLibrary/steps/ProfileStep";
import {
	EMPTY_LIBRARY_FORM,
	buildAgencyUpdateInput,
	buildLibraryInput,
	buildLibraryUpdateInput,
	formValuesFromLibrary,
	type LibraryFormDefaults,
} from "@forms/NewLibrary/libraryPayloads";
import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { hostLmsSelectionQuery } from "@/queryOptions/hostLms";
import {
	consortiumBasicsQuery,
	readConsortiumPresence,
} from "@/queryOptions/consortium";
import { describeGraphQLError } from "@helpers/graphQLErrors";
import type { NewLibrarySearch } from "@helpers/librarySetupFlow";
import type { NewLibraryFormValues } from "@schemas/newLibrarySchema";
import { useLibraryChapterForm } from "../useLibraryChapterForm";
import { useLibrarySetupWrites } from "../useLibrarySetupWrites";

const PROFILE_FIELDS: (keyof NewLibraryFormValues)[] = [
	"fullName",
	"shortName",
	"abbreviatedName",
	"agencyCode",
	"address",
	"type",
	"latitude",
	"longitude",
	"authProfile",
	"maxConsortialLoans",
	"maxLocalHolds",
];

type ProfileChapterProps =
	| { kind: "new"; search: NewLibrarySearch }
	| { kind: "existing"; library: any; onNext: () => void; onBack: () => void };

/** "Tell us about the library." For a new library, answering it creates the record. */
export default function ProfileChapter(props: ProfileChapterProps) {
	const { t } = useTranslation();
	const gqlClient = useGraphQLClient();
	const { data, isLoading } = useQuery({
		...hostLmsSelectionQuery(gqlClient),
		enabled: props.kind === "new",
	});

	if (props.kind === "existing") {
		return (
			<ProfileForm
				defaults={formValuesFromLibrary(props.library)}
				libraryId={props.library.id}
				onNext={props.onNext}
				onBack={props.onBack}
			/>
		);
	}

	if (isLoading) return <Skeleton variant="rounded" height={480} />;

	const hostLms = (data?.hostLms?.content ?? []).find(
		(candidate: any) => candidate.code === props.search.hostLms,
	);
	if (!hostLms) {
		return (
			<Alert severity="warning">
				{t("libraries.setup.connection.not_found", {
					code: props.search.hostLms ?? "",
				})}
			</Alert>
		);
	}

	return (
		<ProfileForm
			defaults={{
				...EMPTY_LIBRARY_FORM,
				hostLmsCode: hostLms.code,
				hostLmsId: hostLms.id,
				hostLmsName: hostLms.name ?? "",
				lmsClientClass: hostLms.lmsClientClass,
				agencyCode: props.search.agency ?? "",
			}}
			search={props.search}
		/>
	);
}

function ProfileForm({
	defaults,
	libraryId,
	search,
	onNext,
	onBack,
}: {
	defaults: LibraryFormDefaults;
	libraryId?: string;
	search?: NewLibrarySearch;
	onNext?: () => void;
	onBack?: () => void;
}) {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const gqlClient = useGraphQLClient();
	const writes = useLibrarySetupWrites();
	const [error, setError] = useState<string | null>(null);
	const { consortiumGroup } = readConsortiumPresence(
		useQuery(consortiumBasicsQuery(gqlClient)),
	);
	const { methods, validate, markSaved } = useLibraryChapterForm(
		"profile",
		defaults,
		PROFILE_FIELDS,
	);

	const onContinue = async () => {
		setError(null);
		if (!(await validate())) return;
		const formData = methods.getValues();

		try {
			if (libraryId) {
				if (methods.formState.isDirty) {
					await writes.updateLibrary.mutateAsync(
						buildLibraryUpdateInput(formData, libraryId),
					);
					// Participation and the loan cap are the agency's, not the library's
					if (formData.agencyCode) {
						await writes.updateAgency.mutateAsync(
							buildAgencyUpdateInput(formData),
						);
					}
					markSaved(formData);
				}
				onNext?.();
				return;
			}

			// Contacts are the next question, asked once the library exists to hold them
			const created = await writes.createLibrary.mutateAsync(
				buildLibraryInput({ ...formData, contacts: [] }),
			);
			const newId: string | undefined = created?.createLibrary?.id;
			if (!newId) {
				setError(t("ui.error.general"));
				return;
			}
			markSaved(formData);

			// In the consortium from the start, so it is not left attached to nothing. A
			// failure is not reported here: the group chapter, next but one, retries and says
			if (consortiumGroup) {
				await writes.joinGroup
					.mutateAsync({ groupId: consortiumGroup.id, libraryId: newId })
					.catch(() => undefined);
			}

			navigate({
				to: "/libraries/$libraryId/setup/$step",
				params: { libraryId: newId, step: "contacts" },
				replace: true,
			});
		} catch (caught) {
			setError(describeGraphQLError(caught, t("ui.error.general")));
		}
	};

	return (
		<>
			<FormProvider {...methods}>
				<form noValidate aria-busy={writes.busy}>
					<ProfileStep />
				</form>
			</FormProvider>

			{error && (
				<Alert severity="error" role="alert" sx={{ mt: 2 }}>
					{error}
				</Alert>
			)}

			<SetupFooter
				onBack={
					onBack ??
					(() =>
						navigate({
							to: "/libraries/new/$step",
							params: { step: "connection" },
							search,
						}))
				}
				onContinue={() => void onContinue()}
				busy={writes.busy}
				continueLabel={
					libraryId ? undefined : t("libraries.setup.profile.create")
				}
			/>
		</>
	);
}
