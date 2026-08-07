import { useTranslation } from "react-i18next";
import { useFormContext, Controller } from "react-hook-form";
import { Stack, TextField, MenuItem, Typography, Alert } from "@mui/material";

export default function HostLmsStep() {
	const { t } = useTranslation();
	const {
		control,
		formState: { errors },
	} = useFormContext();

	return (
		<Stack spacing={3} direction="column" sx={{ mt: 1 }}>
			<Typography>{t("hostlms.new_explanation")}</Typography>

			<Stack direction="row" spacing={2}>
				<Controller
					name="hostLmsCode"
					control={control}
					render={({ field }) => (
						<TextField
							{...field}
							required
							fullWidth
							label={t("hostlms.code")}
							error={!!errors.hostLmsCode}
							helperText={errors.hostLmsCode?.message as string}
						/>
					)}
				/>
				<Controller
					name="hostLmsName"
					control={control}
					render={({ field }) => (
						<TextField
							{...field}
							required
							fullWidth
							label={t("hostlms.name")}
							error={!!errors.hostLmsName}
							helperText={errors.hostLmsName?.message as string}
						/>
					)}
				/>
			</Stack>
			{/** TODO: I18N */}
			<Controller
				name="lmsClientClass"
				control={control}
				render={({ field }) => (
					<TextField
						{...field}
						select
						required
						fullWidth
						label={t("hostlms.type")}
						error={!!errors.lmsClientClass}
						helperText={errors.lmsClientClass?.message as string}
					>
						<MenuItem value="org.olf.dcb.core.interaction.alma.AlmaHostLmsClient">
							{t("hostlms.names.alma")}
						</MenuItem>
						<MenuItem value="org.olf.dcb.core.interaction.polaris.PolarisLmsClient">
							{t("hostlms.names.polaris")}
						</MenuItem>
						<MenuItem value="org.olf.dcb.core.interaction.folio.ConsortialFolioHostLmsClient">
							{t("hostlms.names.folio")}
						</MenuItem>
						<MenuItem value="org.olf.dcb.core.interaction.koha.KohaHostLmsClient">
							{t("hostlms.names.koha")}
						</MenuItem>
						<MenuItem value="org.olf.dcb.core.interaction.sierra.SierraHostLmsClient">
							{t("hostlms.names.sierra")}
						</MenuItem>
						<MenuItem value="org.olf.dcb.core.interaction.foundation.FoundationClient">
							{t("hostlms.names.foundation")}
						</MenuItem>
						<MenuItem value="org.olf.dcb.core.interaction.AbstractHostLmsClient">
							{t("hostlms.names.ors_appliance")}
						</MenuItem>
						{}
					</TextField>
				)}
			/>

			<Controller
				name="clientConfig"
				control={control}
				render={({ field }) => (
					<TextField
						{...field}
						fullWidth
						multiline
						rows={4}
						label={t("hostlms.client_config_json")}
						placeholder='{"base-url": "https://api.example.com", "key": "123"}'
						error={!!errors.clientConfig}
						helperText={
							(errors.clientConfig?.message as string) ||
							t("hostlms.client_config_json_helper")
						}
						onChange={(e) => {
							// Store as string in the input, but we will parse it to JSON in the onSubmit orchestrator
							field.onChange(e.target.value);
						}}
					/>
				)}
			/>

			<Stack direction="row" spacing={2}>
				<Controller
					name="suppressionRulesetName"
					control={control}
					render={({ field }) => (
						<TextField
							{...field}
							fullWidth
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
							fullWidth
							label={t("hostlms.itemSuppressionRulesetName")}
						/>
					)}
				/>
			</Stack>

			<Alert severity="info">{t("hostlms.ping_warning")}</Alert>
		</Stack>
	);
}
