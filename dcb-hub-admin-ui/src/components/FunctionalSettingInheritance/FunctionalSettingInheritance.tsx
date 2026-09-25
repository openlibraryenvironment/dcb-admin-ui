import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	Alert,
	Box,
	Button,
	Skeleton,
	Switch,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Typography,
} from "@mui/material";
import { visuallyHidden } from "@mui/utils";

import { useGraphQLClient } from "@hooks/useGraphQLClient";
import {
	getResolvedFunctionalSettings,
	getSettingsBearingGroupType,
} from "@queries/getResolvedFunctionalSettings";
import {
	revertFunctionalSettingToInherited,
	setFunctionalSettingAtScopes,
} from "@mutations/functionalSettingScopes";
import { settingLabelKey } from "@constants/functionalSettings";
import { canRevert, provenanceOf } from "@helpers/settingProvenance";
import type {
	LoadResolvedFunctionalSettingsQuery,
	LoadSettingsBearingGroupTypeQuery,
	SetFunctionalSettingAtScopesMutation,
	SetFunctionalSettingAtScopesMutationVariables,
	RevertFunctionalSettingToInheritedMutation,
	RevertFunctionalSettingToInheritedMutationVariables,
} from "@generated/graphql";

/**
 * What a scope actually gets, where each value came from, and the way back — §V-22.6.
 *
 * A semantic table rather than a DataGrid. Eight rows with an interactive control in each is
 * not what the grid is for: it would bring filtering and column menus nothing here needs, and
 * put a switch inside a roving-tabindex cell, which is a keyboard trap dressed as a feature.
 * The doctrine's rule is against hand-rolling virtualization and column menus, and this is
 * neither.
 */
export interface FunctionalSettingInheritanceProps {
	/** LIBRARY or LIBRARY_GROUP. The consortium level is edited on its own page. */
	scopeType: "LIBRARY" | "LIBRARY_GROUP";
	scopeId: string;
	/** Used in the generated change reason, so the audit trail names what was edited. */
	scopeName: string;
	canEdit: boolean;
}

type ResolvedSetting =
	LoadResolvedFunctionalSettingsQuery["resolvedFunctionalSettings"][number];

export default function FunctionalSettingInheritance({
	scopeType,
	scopeId,
	scopeName,
	canEdit,
}: FunctionalSettingInheritanceProps) {
	const { t } = useTranslation();
	const client = useGraphQLClient();
	const queryClient = useQueryClient();
	const captionId = useId();

	const [announcement, setAnnouncement] = useState("");

	const settingsKey = ["resolvedFunctionalSettings", scopeType, scopeId];

	const settings = useQuery({
		queryKey: settingsKey,
		queryFn: () =>
			client.request<LoadResolvedFunctionalSettingsQuery>(
				getResolvedFunctionalSettings(),
				{ scopeType, scopeId },
			),
		// Configuration, changed by hand and rarely. Refetching it on every mount of a tab
		// somebody is clicking through would be a self-inflicted load test for data that
		// moves a few times a year.
		staleTime: 1000 * 60 * 5,
		enabled: Boolean(scopeId),
	});

	/**
	 * Whether this deployment has a group level at all — §V-22.6b.
	 *
	 * Deployment configuration, so it is asked once and cached for the session. The
	 * introduction below has to be true of the chain the reader is actually looking at: a
	 * consortium that has named no settings-bearing group type has NO group level, and
	 * telling its administrators a value might be coming from a group describes a level that
	 * does not exist.
	 */
	const groupType = useQuery({
		queryKey: ["settingsBearingGroupType"],
		queryFn: () =>
			client.request<LoadSettingsBearingGroupTypeQuery>(getSettingsBearingGroupType()),
		staleTime: Infinity,
		// Only the library view needs it: it is what decides whether the chain this library
		// sits in has a group level to describe. A group already knows it is one.
		enabled: scopeType === "LIBRARY",
		select: (data) => data.settingsBearingGroupType ?? null,
	});

	const rows: ResolvedSetting[] = settings.data?.resolvedFunctionalSettings ?? [];

	const afterWrite = (message: string) => {
		setAnnouncement(message);
		// The narrowest key that is actually stale. A bare invalidateQueries would re-fire
		// every mounted query on the page, and this panel sits under a form that has its own.
		return queryClient.invalidateQueries({ queryKey: settingsKey });
	};

	const override = useMutation({
		mutationFn: (variables: { name: string; enabled: boolean }) =>
			client.request<
				SetFunctionalSettingAtScopesMutation,
				SetFunctionalSettingAtScopesMutationVariables
			>(setFunctionalSettingAtScopes(), {
				input: {
					scopeType,
					scopeIds: [scopeId],
					name: variables.name as never,
					enabled: variables.enabled,
					// Generated rather than asked for. A single toggle is one deliberate act
					// on one scope and the audit row already carries who, what and when; the
					// BULK action asks for a reason, because "which twelve libraries and why"
					// is the question nobody can answer afterwards without one.
					reason: t("settings_inheritance.reason_single", { scope: scopeName }),
					changeCategory: "Functional setting",
				},
			}),
		onSuccess: (_data, variables) =>
			afterWrite(
				t("settings_inheritance.announced_set", {
					setting: label(variables.name),
					state: variables.enabled
						? t("consortium.settings.enabled")
						: t("consortium.settings.disabled"),
				}),
			),
	});

	const revert = useMutation({
		mutationFn: (name: string) =>
			client.request<
				RevertFunctionalSettingToInheritedMutation,
				RevertFunctionalSettingToInheritedMutationVariables
			>(revertFunctionalSettingToInherited(), {
				input: {
					scopeType,
					scopeIds: [scopeId],
					name: name as never,
					reason: t("settings_inheritance.reason_revert", { scope: scopeName }),
					changeCategory: "Functional setting",
				},
			}),
		onSuccess: (_data, name) =>
			afterWrite(
				t("settings_inheritance.announced_reverted", { setting: label(name) }),
			),
	});

	function label(name: string): string {
		const key = settingLabelKey(name);
		return key ? t(key) : name;
	}

	/** The sentence for one row. The RULE behind it is in `provenanceOf`, and tested there. */
	function provenance(row: ResolvedSetting): string {
		return t(`settings_inheritance.${provenanceOf(row)}`, {
			source: row.sourceName ?? t(`settings_inheritance.level.${row.source}`),
		});
	}

	const busy = override.isPending || revert.isPending;
	const failure = override.error ?? revert.error;

	return (
		<Box sx={{ mt: 4 }}>
			<Typography variant="h3" component="h2" gutterBottom>
				{t("settings_inheritance.title")}
			</Typography>
			<Typography id={captionId} color="text.secondary" sx={{ mb: 2 }}>
				{/* The sentence has to be true of the chain the reader is looking at. A GROUP
				    inherits from the consortium and from nothing else, so the library copy —
				    which may mention a group — would describe a level above this one that
				    does not exist. */}
				{scopeType === "LIBRARY_GROUP"
					? t("settings_inheritance.introduction_group")
					: groupType.data
						? t("settings_inheritance.introduction_with_group")
						: t("settings_inheritance.introduction")}
			</Typography>

			{/* Result counts and state changes must reach a screen reader, not only the eye:
			    the switch's own state is announced, but "reverted, now inheriting Enabled
			    from the consortium" is the part that is not visible in the control. */}
			<Box aria-live="polite" aria-atomic="true" sx={visuallyHidden}>
				{announcement}
			</Box>

			{failure ? (
				// dcb-service writes its refusals for a person. Shown as-is: validating on
				// the server is pointless if the administrator is told only that it failed.
				<Alert severity="error" sx={{ mb: 2 }}>
					{String(failure)}
				</Alert>
			) : null}

			{settings.isLoading ? (
				// Matched to the table it replaces, because layout shift is the one metric a
				// reviewer cannot see in a diff.
				<Skeleton variant="rounded" height={320} />
			) : (
				<TableContainer sx={{ overflowX: "auto" }}>
					<Table size="small" aria-describedby={captionId}>
						<TableHead>
							<TableRow>
								<TableCell>{t("consortium.settings.name")}</TableCell>
								<TableCell>{t("consortium.settings.enabled_header")}</TableCell>
								<TableCell>{t("settings_inheritance.source_header")}</TableCell>
								<TableCell>{t("settings_inheritance.actions_header")}</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{rows.map((row) => (
								<TableRow key={row.name}>
									<TableCell component="th" scope="row">
										{label(row.name)}
									</TableCell>
									<TableCell>
										<Switch
											checked={row.enabled}
											disabled={!canEdit || busy}
											onChange={(event) =>
												override.mutate({
													name: row.name,
													enabled: event.target.checked,
												})
											}
											slotProps={{
												input: {
													// The row header is not the switch's accessible name,
													// so it is given one that says which setting it is.
													"aria-label": t("settings_inheritance.toggle_label", {
														setting: label(row.name),
													}),
												},
											}}
										/>
									</TableCell>
									<TableCell>{provenance(row)}</TableCell>
									<TableCell>
										<Button
											size="small"
											// Enabled only where there is something to undo — see canRevert.
											disabled={!canEdit || busy || !canRevert(row)}
											onClick={() => revert.mutate(row.name)}
											// SC 2.5.8: a dense table row is the standard place a
											// text button ends up below the 24px target floor.
											sx={{ minHeight: 24 }}
										>
											{t("settings_inheritance.revert")}
										</Button>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</TableContainer>
			)}
		</Box>
	);
}
