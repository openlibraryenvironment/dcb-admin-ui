import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useFormContext, Controller, useWatch } from "react-hook-form";
import {
	Alert,
	AlertTitle,
	MenuItem,
	Stack,
	TextField,
	ToggleButton,
	ToggleButtonGroup,
	Typography,
} from "@mui/material";
import { Code, ListAlt } from "@mui/icons-material";

import ClientConfigFields, {
	RecommendedConfigGaps,
} from "./ClientConfigFields";
import {
	HOST_LMS_PROFILES,
	buildClientConfig,
	clientConfigToFields,
	getHostLmsProfile,
} from "@helpers/hostLmsClientConfig";

/**
 * Everything needed to create a Host LMS, with the client config asked for
 * field by field.
 *
 * The step previously offered a single free-text JSON box and every ILS in the
 * dropdown. Two things were wrong with that: the required keys were only
 * discoverable by reading dcb-service's 400, and three of the seven ILS options
 * cannot be created at all - HostLmsConfigValidator has no case for Koha, the
 * Foundation connector or the OpenRS appliance, so it rejects them outright.
 */
export default function HostLmsStep({ busy = false }: { busy?: boolean }) {
	const { t } = useTranslation();
	const {
		control,
		getValues,
		setValue,
		formState: { errors },
	} = useFormContext();

	const [lmsClientClass, clientConfigMode] = useWatch({
		control,
		name: ["lmsClientClass", "clientConfigMode"],
	});

	const profile = getHostLmsProfile(lmsClientClass);
	const isJsonMode = clientConfigMode === "json";
	// Keys the raw editor carried that the guided form has no home for. Dropping
	// them silently would lose real configuration.
	const [unmappedKeys, setUnmappedKeys] = useState<string[]>([]);

	const handleModeChange = (mode: "guided" | "json" | null) => {
		if (!mode || mode === clientConfigMode) return;

		if (mode === "json") {
			// Carry the guided answers across rather than handing the power user a
			// blank editor and making them start again.
			setValue(
				"clientConfig",
				JSON.stringify(
					buildClientConfig(
						lmsClientClass,
						getValues("clientConfigFields") ?? {},
					),
					null,
					2,
				),
				{ shouldDirty: true },
			);
			setUnmappedKeys([]);
		} else {
			const parsed = safeParse(getValues("clientConfig"));
			const { values, unmappedKeys: unmapped } = clientConfigToFields(
				lmsClientClass,
				parsed,
			);
			setValue("clientConfigFields", values, { shouldDirty: true });
			setUnmappedKeys(unmapped);
		}
		setValue("clientConfigMode", mode, { shouldDirty: true });
	};

	return (
		<Stack spacing={3} direction="column" sx={{ mt: 1 }}>
			<Typography>{t("hostlms.new_explanation")}</Typography>

			<Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
				<Controller
					name="hostLmsCode"
					control={control}
					render={({ field }) => (
						<TextField
							{...field}
							id="host-lms-code"
							required
							fullWidth
							disabled={busy}
							label={t("hostlms.code")}
							error={!!errors.hostLmsCode}
							helperText={
								(errors.hostLmsCode?.message as string) ??
								t("hostlms.code_helper")
							}
						/>
					)}
				/>
				<Controller
					name="hostLmsName"
					control={control}
					render={({ field }) => (
						<TextField
							{...field}
							id="host-lms-name"
							required
							fullWidth
							disabled={busy}
							label={t("hostlms.name")}
							error={!!errors.hostLmsName}
							helperText={errors.hostLmsName?.message as string}
						/>
					)}
				/>
			</Stack>

			<Controller
				name="lmsClientClass"
				control={control}
				render={({ field }) => (
					<TextField
						{...field}
						id="host-lms-type"
						select
						required
						fullWidth
						disabled={busy}
						label={t("hostlms.type")}
						error={!!errors.lmsClientClass}
						helperText={errors.lmsClientClass?.message as string}
					>
						{HOST_LMS_PROFILES.map((option) => (
							<MenuItem
								key={option.lmsClientClass}
								value={option.lmsClientClass}
							>
								{t(option.labelKey)}
							</MenuItem>
						))}
					</TextField>
				)}
			/>

			{!lmsClientClass && (
				<Alert severity="info">{t("hostlms.select_type_first")}</Alert>
			)}

			{/* Every class the picker offers is one HostLmsConfigValidator accepts,
			    so a chosen type always has a profile. The guard is for a Host LMS
			    resumed from a record written before this list existed. */}
			{lmsClientClass && !profile && (
				<Alert severity="warning">
					<AlertTitle>{t("hostlms.unsupported_title")}</AlertTitle>
					{t("hostlms.unsupported_body", { ils: lmsClientClass })}
				</Alert>
			)}

			{profile && (
				<>
					<Stack
						direction={{ xs: "column", sm: "row" }}
						spacing={1}
						sx={{ justifyContent: "space-between", alignItems: "baseline" }}
					>
						<Typography variant="h6" component="h3">
							{t("hostlms.client_config.title")}
						</Typography>
						<ToggleButtonGroup
							size="small"
							exclusive
							value={clientConfigMode ?? "guided"}
							onChange={(_, mode) => handleModeChange(mode)}
							aria-label={t("hostlms.config_fields.mode_label")}
							disabled={busy}
						>
							<ToggleButton
								value="guided"
								aria-label={t("hostlms.config_fields.mode_guided")}
							>
								<ListAlt fontSize="small" sx={{ mr: 1 }} />
								{t("hostlms.config_fields.mode_guided")}
							</ToggleButton>
							<ToggleButton
								value="json"
								aria-label={t("hostlms.config_fields.mode_json")}
							>
								<Code fontSize="small" sx={{ mr: 1 }} />
								{t("hostlms.config_fields.mode_json")}
							</ToggleButton>
						</ToggleButtonGroup>
					</Stack>

					{isJsonMode ? (
						<Stack spacing={2}>
							<Alert severity="info">
								{t("hostlms.config_fields.json_mode_warning")}
							</Alert>
							<Controller
								name="clientConfig"
								control={control}
								render={({ field }) => (
									<TextField
										{...field}
										id="host-lms-client-config"
										fullWidth
										multiline
										rows={12}
										disabled={busy}
										label={t("hostlms.client_config_json")}
										placeholder='{"base-url": "https://api.example.com", "key": "123"}'
										error={!!errors.clientConfig}
										helperText={
											(errors.clientConfig?.message as string) ||
											t("hostlms.client_config_json_helper")
										}
										slotProps={{
											htmlInput: {
												spellCheck: false,
												style: { fontFamily: "monospace" },
											},
										}}
									/>
								)}
							/>
						</Stack>
					) : (
						<Stack spacing={2}>
							{unmappedKeys.length > 0 && (
								<Alert severity="warning">
									{t("hostlms.config_fields.unmapped_keys", {
										keys: unmappedKeys.join(", "),
									})}
								</Alert>
							)}
							<ClientConfigFields
								lmsClientClass={lmsClientClass}
								disabled={busy}
							/>
						</Stack>
					)}

					{/* Only meaningful for the guided form: in JSON mode the user is
					    editing the object directly and has the whole thing in view. */}
					{!isJsonMode && (
						<RecommendedConfigGaps lmsClientClass={lmsClientClass} />
					)}

					<Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
						<Controller
							name="suppressionRulesetName"
							control={control}
							render={({ field }) => (
								<TextField
									{...field}
									id="host-lms-bib-suppression"
									fullWidth
									disabled={busy}
									label={t("hostlms.bibSuppressionRulesetName")}
								/>
							)}
						/>
						<Controller
							name="itemSuppressionRulesetName"
							control={control}
							render={({ field }) => (
								<TextField
									{...field}
									id="host-lms-item-suppression"
									fullWidth
									disabled={busy}
									label={t("hostlms.itemSuppressionRulesetName")}
								/>
							)}
						/>
					</Stack>

					<Alert severity="info">
						<AlertTitle>{t("hostlms.ping_warning_title")}</AlertTitle>
						{t("hostlms.ping_warning")}
					</Alert>
				</>
			)}
		</Stack>
	);
}

/** Advanced-mode JSON is user input, so it can be halfway through being typed. */
function safeParse(raw: unknown): Record<string, unknown> {
	if (typeof raw !== "string" || raw.trim() === "") return {};
	try {
		const parsed = JSON.parse(raw);
		return parsed && typeof parsed === "object" ? parsed : {};
	} catch {
		return {};
	}
}
