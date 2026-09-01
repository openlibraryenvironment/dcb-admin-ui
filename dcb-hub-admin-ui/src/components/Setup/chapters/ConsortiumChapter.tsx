import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert, AlertTitle, LinearProgress, Stack } from "@mui/material";

import ConsortiumDetailsFields from "@forms/ConsortiumSetup/steps/ConsortiumDetailsFields";
import { createConsortiumWithGroup } from "@forms/ConsortiumSetup/createConsortiumWithGroup";
import SetupFooter from "../SetupFooter";
import { useSetupNavigation } from "@hooks/useSetupNavigation";
import { useConsortiumSetup } from "@hooks/useConsortiumSetup";
import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { describeGraphQLError } from "@helpers/graphQLErrors";
import { defaultFunctionalSettingSelection } from "@constants/functionalSettings";
import {
	newConsortiumSchema,
	type NewConsortiumFormValues,
} from "@schemas/newConsortiumSchema";
import { CONSORTIUM_BASICS_QUERY_KEY } from "@/queryOptions/consortium";
import { useRegisterSetupDirty } from "../setupDirty";

/** The details chapter's own fields. Everything else on the schema is another chapter's. */
const DETAILS_FIELDS: (keyof NewConsortiumFormValues)[] = [
	"name",
	"displayName",
	"groupName",
	"groupCode",
	"dateOfLaunch",
	"websiteUrl",
	"catalogueSearchUrl",
	"description",
];

/**
 * C2 — "Tell us about your consortium".
 *
 * <h2>This chapter commits</h2>
 *
 * It writes the library group and the consortium, with NO functional settings and NO
 * contacts - both empty lists, which `CreateConsortiumDataFetcher` iterates happily. That
 * is the commit-early decision: somebody who answers this chapter and then closes the
 * laptop has a real consortium to come back to, and every chapter after this one is an
 * ordinary update through a mutation that already has a page behind it.
 *
 * The alternative - buffering six chapters and writing at the end - is also what makes
 * progress unknowable: the rail could only report where the user had got to in THIS
 * session, and nothing would survive a refresh.
 *
 * <h2>Once it is done</h2>
 *
 * There is one consortium per instance, so revisiting shows what exists and points at the
 * consortium page to edit it. Re-running the create would fail on the duplicate, and
 * turning this chapter into a second edit form for a record that already has one is how
 * two forms end up disagreeing about the same row.
 */
export default function ConsortiumChapter() {
	const { t } = useTranslation();
	const gqlClient = useGraphQLClient();
	const queryClient = useQueryClient();
	const { goNext, goBack } = useSetupNavigation("consortium");
	const { consortium } = useConsortiumSetup();

	const [error, setError] = useState<string | null>(null);
	const [busyMessage, setBusyMessage] = useState<string | null>(null);
	/**
	 * Validation is awaited BEFORE anything is set busy, so two quick clicks both get
	 * through that gap. A disabled button does not close it; a ref checked before the
	 * first await does. The dialog learned this by creating a consortium twice.
	 */
	const isSubmitting = useRef(false);

	const methods = useForm<NewConsortiumFormValues>({
		mode: "onTouched",
		resolver: zodResolver(newConsortiumSchema) as any,
		defaultValues: {
			name: "",
			displayName: "",
			groupName: "",
			groupCode: "",
			dateOfLaunch: new Date().toISOString().slice(0, 10),
			websiteUrl: "",
			catalogueSearchUrl: "",
			description: "",
			// Not shown. `reason` and `changeCategory` are String! on ConsortiumInput,
			// and a first-time user has no change to justify - so setup answers it.
			reason: "Initial consortium setup",
			changeReferenceUrl: "",
			// Neither of these is collected here; both are sent empty and written by
			// their own chapters. The defaults exist only to satisfy the shared schema.
			functionalSettings: defaultFunctionalSettingSelection(),
			contacts: [
				{
					firstName: "",
					lastName: "",
					email: "",
					role: "",
					isPrimaryContact: true,
				},
			],
		},
	});

	// Tells the layout there is unsaved work here, so leaving the chapter asks first.
	// Registered rather than set: it clears itself on unmount, so a chapter cannot
	// leave the flow permanently blocked.
	useRegisterSetupDirty("consortium", methods.formState.isDirty);

	const { mutateAsync: create } = useMutation({
		mutationFn: (values: NewConsortiumFormValues) =>
			createConsortiumWithGroup(gqlClient, {
				values,
				includeFunctionalSettings: false,
				includeContacts: false,
				onProgress: (stage) =>
					setBusyMessage(
						stage === "group"
							? t("consortium.new.busy_group")
							: t("consortium.new.busy_consortium"),
					),
			}),
		onSuccess: ({ groupCreated }) => {
			if (groupCreated) {
				queryClient.invalidateQueries({ queryKey: ["groupsSelection"] });
				queryClient.invalidateQueries({ queryKey: ["groups"] });
			}
			// Narrow keys only. A bare invalidateQueries() would re-fire every mounted
			// query in the application to reflect one new row.
			queryClient.invalidateQueries({ queryKey: CONSORTIUM_BASICS_QUERY_KEY });
			queryClient.invalidateQueries({ queryKey: ["LoadConsortium"] });
		},
	});

	if (consortium) {
		return (
			<Stack spacing={3}>
				<Alert severity="success">
					<AlertTitle>{t("setup.consortium.already_title")}</AlertTitle>
					{t("setup.consortium.already_body", {
						name: consortium.displayName ?? consortium.name,
					})}
				</Alert>
				<SetupFooter onBack={goBack} onContinue={goNext} />
			</Stack>
		);
	}

	const handleContinue = async () => {
		if (isSubmitting.current) return;
		isSubmitting.current = true;
		setError(null);
		try {
			if (!(await methods.trigger(DETAILS_FIELDS as any))) {
				// Validation failing silently is what made the library wizard's Next
				// button look broken. Put the user on the first thing that is wrong.
				const firstError = Object.keys(methods.formState.errors)[0];
				if (firstError) methods.setFocus(firstError as any);
				return;
			}
			await create(methods.getValues());
			goNext();
		} catch (failure: any) {
			console.error("Consortium creation failed:", failure);
			setError(describeGraphQLError(failure, t("consortium.new.error")));
		} finally {
			setBusyMessage(null);
			isSubmitting.current = false;
		}
	};

	const isBusy = busyMessage !== null;

	return (
		<Stack spacing={2}>
			{/* Reserves its row whether or not it is running, so the chapter does not
			    jump when the mutation starts - a layout shift a reviewer cannot see in
			    a diff is still a layout shift. */}
			<div style={{ height: 4 }}>{isBusy && <LinearProgress />}</div>

			{isBusy && (
				<Alert severity="info" role="status">
					{busyMessage}
				</Alert>
			)}

			{error && (
				<Alert severity="error" role="alert" onClose={() => setError(null)}>
					<AlertTitle>{t("consortium.new.error")}</AlertTitle>
					{error}
				</Alert>
			)}

			<FormProvider {...methods}>
				<ConsortiumDetailsFields
					showChangeLogFields={false}
					showExplanation={false}
				/>
			</FormProvider>

			{/* No skip. Every chapter after this one, and the whole libraries flow,
			    needs the record and its group to exist. */}
			<SetupFooter
				onBack={goBack}
				onContinue={handleContinue}
				continueLabel={t("setup.actions.save_and_continue")}
				busy={isBusy}
			/>
		</Stack>
	);
}
