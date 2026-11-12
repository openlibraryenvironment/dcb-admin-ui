import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { FormProvider } from "react-hook-form";
import {
	Alert,
	AlertTitle,
	FormControl,
	FormControlLabel,
	FormLabel,
	Radio,
	RadioGroup,
	Skeleton,
	Stack,
	Typography,
} from "@mui/material";

import SetupFooter from "@components/Setup/SetupFooter";
import HostLmsVerification from "@components/HostLmsVerification/HostLmsVerification";
import { CustomLinkButton } from "@components/CustomLink/CustomLink";
import HostLmsStep from "@forms/NewLibrary/steps/HostLmsStep";
import {
	EMPTY_LIBRARY_FORM,
	agencyCodeFromHostLms,
	buildHostLmsSettings,
	shouldCreateHostLms,
} from "@forms/NewLibrary/libraryPayloads";
import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { useSingleFlight } from "@hooks/useSingleFlight";
import { hostLmsSelectionQuery } from "@/queryOptions/hostLms";
import { updateHostLmsMutation } from "@mutations/updateHostLms";
import { createHostLmsRecord } from "@helpers/hostLmsCreation";
import {
	HOST_LMS_CLASSES,
	getHostLmsProfile,
	ingestSourceClassToUpdate,
} from "@helpers/hostLmsClientConfig";
import {
	verificationFrom,
	type HostLmsVerificationResult,
} from "@helpers/hostLmsVerification";
import { isNcipOnboardingEnabled } from "@helpers/featureFlags";
import { describeGraphQLError } from "@helpers/graphQLErrors";
import type { NewLibrarySearch } from "@helpers/librarySetupFlow";
import type {
	CreateHostLmsInput,
	UpdateHostLmsInput,
	UpdateHostLmsMutation,
	UpdateHostLmsMutationVariables,
} from "@generated/graphql";
import { useLibraryChapterForm } from "../useLibraryChapterForm";

const NEW = "__new__";

interface SelectableHostLms {
	id: string;
	code: string;
	name?: string | null;
	lmsClientClass: string;
}

/** "How does DCB reach it?" An existing system, or a new one created and tested here. */
export default function ConnectionChapter({
	search,
}: {
	search: NewLibrarySearch;
}) {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const gqlClient = useGraphQLClient();
	const queryClient = useQueryClient();

	const ils = search.ils;
	const lmsClientClass = ils ? HOST_LMS_CLASSES[ils] : undefined;
	const profile = getHostLmsProfile(lmsClientClass);

	const { data, isLoading } = useQuery(hostLmsSelectionQuery(gqlClient));
	const all = (data?.hostLms?.content ?? []) as SelectableHostLms[];
	const sameType = all.filter(
		(hostLms) => hostLms.lmsClientClass === lmsClientClass,
	);

	const [choice, setChoice] = useState<string | null>(null);
	const [byHand, setByHand] = useState(false);
	const [result, setResult] = useState<HostLmsVerificationResult | null>(null);
	const [savedSettings, setSavedSettings] = useState<string | null>(null);
	const [ingestSourcePending, setIngestSourcePending] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const { methods, validate, markSaved } = useLibraryChapterForm(
		"connection",
		{
			...EMPTY_LIBRARY_FORM,
			isCreatingHostLms: true,
			lmsClientClass: lmsClientClass ?? "",
		},
		["hostLmsCode", "hostLmsName", "clientConfig", "clientConfigFields"],
	);

	const create = useMutation({
		mutationFn: (input: CreateHostLmsInput) =>
			createHostLmsRecord(gqlClient, input),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ["hostlmss"] }),
	});
	const update = useMutation({
		mutationFn: (input: UpdateHostLmsInput) =>
			gqlClient.request<UpdateHostLmsMutation, UpdateHostLmsMutationVariables>(
				updateHostLmsMutation(),
				{ input },
			),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ["hostlmss"] }),
	});
	// Validation runs before the create is pending
	const save = useSingleFlight();
	const testing = create.isPending || update.isPending;
	const busy = testing || save.running;

	const goTo = (step: "system" | "profile", next: NewLibrarySearch) =>
		navigate({ to: "/libraries/new/$step", params: { step }, search: next });

	if (!ils || !lmsClientClass) {
		return (
			<>
				<Alert severity="info">
					{t("libraries.setup.connection.no_system")}
				</Alert>
				<SetupFooter onContinue={() => goTo("system", {})} />
			</>
		);
	}

	const systemLine = (
		<Typography sx={{ mb: 2 }}>
			{t("libraries.setup.connection.system", {
				ils: t(profile?.labelKey ?? ""),
			})}
		</Typography>
	);

	// Answered already: the code is in the link, so a colleague opening it lands here.
	// Of this system only: a hand-edited code for another would build the wrong chapters
	if (search.hostLms) {
		const connected = sameType.find(
			(hostLms) => hostLms.code === search.hostLms,
		);
		return (
			<>
				{systemLine}
				{isLoading ? (
					<Skeleton variant="rounded" height={56} />
				) : connected ? (
					<Alert severity="success" role="status">
						{t("libraries.setup.connection.connected", {
							name: connected.name ?? connected.code,
							code: connected.code,
						})}
					</Alert>
				) : (
					<Alert severity="warning">
						{t("libraries.setup.connection.not_found", {
							code: search.hostLms,
						})}
					</Alert>
				)}
				<SetupFooter
					onBack={() => goTo("system", search)}
					onSkip={() =>
						navigate({
							to: "/libraries/new/$step",
							params: { step: "connection" },
							search: { ils },
						})
					}
					skipLabel={t("libraries.setup.connection.choose_again")}
					onContinue={() => goTo("profile", search)}
					continueDisabled={!connected}
				/>
			</>
		);
	}

	const offersInvitation =
		ils === "orsAppliance" && isNcipOnboardingEnabled() && !byHand;
	if (offersInvitation) {
		return (
			<>
				{systemLine}
				<Alert severity="info">
					<AlertTitle>
						{t("libraries.setup.connection.invitation_title")}
					</AlertTitle>
					{t("libraries.setup.connection.invitation_body")}
				</Alert>
				<Stack direction="row" spacing={2} sx={{ mt: 2 }}>
					<CustomLinkButton
						to="/serviceInfo/dcbNcipOnboarding"
						variant="contained"
					>
						{t("libraries.setup.connection.invitation_action")}
					</CustomLinkButton>
				</Stack>
				<SetupFooter
					onBack={() => goTo("system", search)}
					onContinue={() => setByHand(true)}
					continueLabel={t("libraries.setup.connection.by_hand")}
				/>
			</>
		);
	}

	// One created here joins the list on the next fetch; it is still the one being set up
	const offered = sameType.filter(
		(hostLms) => hostLms.id !== result?.hostLms?.id,
	);
	const selected = choice ?? (offered.length > 0 ? offered[0].id : NEW);
	const creatingNew = !!result || offered.length === 0 || selected === NEW;

	const saveNew = async () => {
		setError(null);
		if (!(await validate())) return;
		const formData = methods.getValues();
		const settings = buildHostLmsSettings(formData);
		const settingsKey = JSON.stringify(settings);

		try {
			if (shouldCreateHostLms(result)) {
				const created = await create.mutateAsync({
					code: formData.hostLmsCode,
					lmsClientClass,
					ingestSourceClass: profile?.ingestSourceClass,
					...settings,
				});
				const hostLms = created.createHostLms?.hostLms;
				if (!hostLms?.id) {
					setError(t("hostlms.error.no_data_returned"));
					return;
				}
				methods.setValue("hostLmsId", hostLms.id);
				setResult(created.createHostLms);
				setSavedSettings(settingsKey);
				setIngestSourcePending(created.ingestSourceMissing);
				if (created.ingestSourceMissing) {
					setError(
						t("hostlms.ingest_source_retry", { code: formData.hostLmsCode }),
					);
				}
				markSaved(methods.getValues());
				return;
			}

			if (ingestSourcePending || settingsKey !== savedSettings) {
				const updated = await update.mutateAsync({
					id: result?.hostLms?.id as string,
					...settings,
					ingestSourceClass: ingestSourcePending
						? ingestSourceClassToUpdate(lmsClientClass)
						: undefined,
					changeCategory: "New Host LMS",
				});
				// The update tested the connection again; its answer replaces the create's
				setResult({
					hostLms: result?.hostLms,
					...verificationFrom(updated.updateHostLms),
				});
				setSavedSettings(settingsKey);
				setIngestSourcePending(false);
				markSaved(methods.getValues());
				return;
			}

			goTo("profile", {
				ils,
				hostLms: result?.hostLms?.code ?? undefined,
				// What the settings already answered, so the profile does not ask again
				agency: agencyCodeFromHostLms(undefined, settings.clientConfig),
			});
		} catch (caught) {
			setError(describeGraphQLError(caught, t("ui.error.general")));
		}
	};

	const onContinue = () => {
		if (!creatingNew) {
			const existing = offered.find((hostLms) => hostLms.id === selected);
			if (existing) goTo("profile", { ils, hostLms: existing.code });
			return;
		}
		void save.run(saveNew);
	};

	return (
		<>
			{systemLine}

			{isLoading ? (
				<Skeleton variant="rounded" height={120} />
			) : (
				offered.length > 0 &&
				!result && (
					<FormControl component="fieldset" sx={{ mb: 3 }}>
						<FormLabel component="legend" id="library-connection-label">
							{t("libraries.setup.connection.existing_question")}
						</FormLabel>
						<RadioGroup
							aria-labelledby="library-connection-label"
							name="library-connection"
							value={selected}
							onChange={(event) => setChoice(event.target.value)}
						>
							{offered.map((hostLms) => (
								<FormControlLabel
									key={hostLms.id}
									value={hostLms.id}
									control={<Radio />}
									label={t("libraries.setup.connection.existing_option", {
										name: hostLms.name ?? hostLms.code,
										code: hostLms.code,
									})}
								/>
							))}
							<FormControlLabel
								value={NEW}
								control={<Radio />}
								label={t("libraries.setup.connection.new_option")}
							/>
						</RadioGroup>
					</FormControl>
				)
			)}

			{creatingNew && (
				<FormProvider {...methods}>
					<form noValidate aria-busy={busy}>
						<HostLmsStep busy={busy} />
					</form>
				</FormProvider>
			)}

			{creatingNew && result && (
				<Stack spacing={2} sx={{ mt: 3 }} role="status" aria-live="polite">
					<Typography variant="h2" component="h2" sx={{ fontSize: "1.25rem" }}>
						{t("hostlms.verification.step")}
					</Typography>
					<HostLmsVerification result={result} isVerifying={testing} />
				</Stack>
			)}

			{error && (
				<Alert severity="error" role="alert" sx={{ mt: 2 }}>
					{error}
				</Alert>
			)}

			<SetupFooter
				onBack={() => goTo("system", search)}
				onContinue={onContinue}
				busy={busy}
				continueLabel={
					creatingNew && shouldCreateHostLms(result)
						? t("libraries.setup.connection.create")
						: undefined
				}
			/>
		</>
	);
}
