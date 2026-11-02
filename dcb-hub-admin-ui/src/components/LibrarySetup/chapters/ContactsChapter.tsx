import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FormProvider } from "react-hook-form";
import { Alert } from "@mui/material";

import SetupFooter from "@components/Setup/SetupFooter";
import ContactsStep from "@forms/NewLibrary/steps/ContactsStep";
import {
	buildContactInput,
	formValuesFromLibrary,
	newContactsOf,
} from "@forms/NewLibrary/libraryPayloads";
import { describeGraphQLError } from "@helpers/graphQLErrors";
import { useLibraryChapterForm } from "../useLibraryChapterForm";
import { useLibrarySetupWrites } from "../useLibrarySetupWrites";
import type { LibraryChapterProps } from "./chapterProps";

/** "Who should we contact about it?" Only the contacts typed here are written. */
export default function ContactsChapter({
	library,
	onNext,
	onBack,
}: LibraryChapterProps) {
	const { t } = useTranslation();
	const writes = useLibrarySetupWrites();
	const [error, setError] = useState<string | null>(null);
	const { methods, validate, markSaved } = useLibraryChapterForm(
		"contacts",
		formValuesFromLibrary(library),
		["contacts"],
	);

	const onContinue = async () => {
		setError(null);
		if (!(await validate())) return;
		const formData = methods.getValues();
		if (newContactsOf(formData.contacts).length === 0) {
			onNext();
			return;
		}

		try {
			// One at a time, so a failure leaves the ones before it identifiable
			const saved: typeof formData.contacts = [];
			for (const contact of formData.contacts) {
				if (contact.id) {
					saved.push(contact);
					continue;
				}
				const result = await writes.createContact.mutateAsync(
					buildContactInput(contact, formData, library.id),
				);
				// The id is what stops a retry creating this one a second time
				saved.push({
					...contact,
					id: result?.createLibraryContact?.id ?? undefined,
				});
			}
			markSaved({ ...formData, contacts: saved });
			onNext();
		} catch (caught) {
			setError(describeGraphQLError(caught, t("ui.error.general")));
		}
	};

	return (
		<>
			<FormProvider {...methods}>
				<form noValidate aria-busy={writes.busy}>
					<ContactsStep />
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
