import { ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import {
	Alert,
	AlertTitle,
	Checkbox,
	FormControlLabel,
	FormHelperText,
	IconButton,
	InputAdornment,
	Link,
	Stack,
	TextField,
	Typography,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";

import {
	type ClientConfigField,
	type ClientConfigGroup,
	fieldName,
	getHostLmsProfile,
	missingRecommendedClientConfig,
} from "@helpers/hostLmsClientConfig";

/**
 * The per-ILS client config form.
 *
 * Every field here is one key dcb-service's HostLmsConfigValidator looks for,
 * with the explanation that used to exist only in a Java switch statement. The
 * JSON editor remains as the advanced option; this is what someone setting up
 * their tenth library should never have to hand-write.
 */

const errorAt = (errors: any, path: string[]): string | undefined => {
	const node = path.reduce(
		(current, segment) => (current ? current[segment] : undefined),
		errors?.clientConfigFields,
	);
	return typeof node?.message === "string" ? node.message : undefined;
};

/** Values are stored as text and coerced when the config object is built. */
const SecretField = ({
	configField,
	inputId,
	label,
	helperText,
	error,
}: {
	configField: ClientConfigField;
	inputId: string;
	label: string;
	helperText: ReactNode;
	error?: string;
}) => {
	const { t } = useTranslation();
	const { control } = useFormContext();
	// API keys and passwords are pasted far more often than typed, and a masked
	// field with no way to check what landed in it is how a trailing newline
	// becomes a failed ping nobody can explain.
	const [revealed, setRevealed] = useState(false);

	return (
		<Controller
			name={`clientConfigFields.${fieldName(configField)}`}
			control={control}
			render={({ field }) => (
				<TextField
					{...field}
					value={field.value ?? ""}
					id={inputId}
					label={label}
					type={revealed ? "text" : "password"}
					fullWidth
					required={configField.requirement === "required"}
					error={!!error}
					helperText={error ?? helperText}
					// Not "off": that blocks paste and password managers, which is exactly
					// what an admin pasting a 40-character LMS secret needs (WCAG 2.2 SC
					// 3.3.8). "new-password" still stops the browser autofilling the
					// operator's own saved credential into an LMS config field.
					autoComplete="new-password"
					slotProps={{
						input: {
							endAdornment: (
								<InputAdornment position="end">
									<IconButton
										onClick={() => setRevealed((shown) => !shown)}
										edge="end"
										aria-label={
											revealed
												? t("ui.actions.hide_value", { field: label })
												: t("ui.actions.show_value", { field: label })
										}
									>
										{revealed ? <VisibilityOff /> : <Visibility />}
									</IconButton>
								</InputAdornment>
							),
						},
					}}
				/>
			)}
		/>
	);
};

const ConfigFieldControl = ({
	configField,
	disabled,
}: {
	configField: ClientConfigField;
	disabled: boolean;
}) => {
	const { t } = useTranslation();
	const {
		control,
		formState: { errors },
	} = useFormContext();

	const name = fieldName(configField);
	const inputId = `client-config-${name.replace(/\./g, "-")}`;
	const label = t(configField.labelKey);
	const error = errorAt(errors, configField.path);
	// "Recommended" is not the same as optional: creation succeeds, then the
	// first real request fails. Say which one this is.
	const description =
		configField.requirement === "recommended"
			? `${t("hostlms.config_fields.recommended")} - ${t(configField.descriptionKey)}`
			: t(configField.descriptionKey);
	// Where the value's real definition is the vendor's, link to it rather than
	// paraphrasing a code table into one line and getting it wrong.
	const helperText: ReactNode = configField.docs ? (
		<>
			{description}{" "}
			<Link
				href={configField.docs.url}
				target="_blank"
				rel="noopener noreferrer"
			>
				{t(configField.docs.labelKey)}
			</Link>
		</>
	) : (
		description
	);

	if (configField.type === "boolean") {
		return (
			<Controller
				name={`clientConfigFields.${name}`}
				control={control}
				render={({ field }) => (
					<Stack>
						<FormControlLabel
							control={
								<Checkbox
									{...field}
									id={inputId}
									checked={field.value === true || field.value === "true"}
									onChange={(event) => field.onChange(event.target.checked)}
									disabled={disabled}
									slotProps={{
										input: {
											"aria-describedby": `${inputId}-helper-text`,
										},
									}}
								/>
							}
							label={label}
						/>
						<FormHelperText id={`${inputId}-helper-text`}>
							{helperText}
						</FormHelperText>
					</Stack>
				)}
			/>
		);
	}

	if (configField.type === "secret") {
		return (
			<SecretField
				configField={configField}
				inputId={inputId}
				label={label}
				helperText={helperText}
				error={error}
			/>
		);
	}

	// A free-form object whose keys are the site's own local values, so there is
	// no form to build - it is edited as JSON and validated as it is typed.
	if (configField.type === "jsonObject") {
		return (
			<Controller
				name={`clientConfigFields.${name}`}
				control={control}
				rules={{
					validate: (value) => {
						if (!value || String(value).trim() === "") return true;
						try {
							const parsed = JSON.parse(String(value));
							return parsed &&
								typeof parsed === "object" &&
								!Array.isArray(parsed)
								? true
								: t("hostlms.config_fields.must_be_object");
						} catch {
							return t("libraries.new.invalid_json_client_config");
						}
					},
				}}
				render={({ field, fieldState }) => (
					<TextField
						{...field}
						value={field.value ?? ""}
						id={inputId}
						label={label}
						fullWidth
						multiline
						rows={5}
						disabled={disabled}
						error={!!fieldState.error}
						helperText={fieldState.error?.message ?? helperText}
						placeholder={configField.placeholder}
						slotProps={{
							htmlInput: {
								spellCheck: false,
								style: { fontFamily: "monospace" },
							},
						}}
					/>
				)}
			/>
		);
	}

	// Stored as an array, typed as a comma-separated list. Arrays only reach
	// this input when hydrated from the JSON editor.
	const isList = configField.type === "stringList";

	return (
		<Controller
			name={`clientConfigFields.${name}`}
			control={control}
			render={({ field }) => (
				<TextField
					{...field}
					value={
						isList && Array.isArray(field.value)
							? field.value.join(", ")
							: (field.value ?? "")
					}
					id={inputId}
					label={label}
					fullWidth
					disabled={disabled}
					required={configField.requirement === "required"}
					error={!!error}
					helperText={
						error ??
						(isList ? (
							<>
								{helperText} {t("hostlms.config_fields.comma_separated")}
							</>
						) : (
							helperText
						))
					}
					placeholder={configField.placeholder}
					type={configField.type === "url" ? "url" : "text"}
					slotProps={
						configField.type === "number"
							? { htmlInput: { inputMode: "numeric" } }
							: undefined
					}
				/>
			)}
		/>
	);
};

const ConfigGroup = ({
	group,
	disabled,
}: {
	group: ClientConfigGroup;
	disabled: boolean;
}) => {
	const { t } = useTranslation();

	return (
		<Stack spacing={2}>
			{group.labelKey && (
				<Stack spacing={0.5}>
					<Typography variant="h6" component="h3">
						{t(group.labelKey)}
					</Typography>
					{group.descriptionKey && (
						<Typography variant="body2" color="text.secondary">
							{t(group.descriptionKey)}
						</Typography>
					)}
				</Stack>
			)}
			{group.fields.map((configField) => (
				<ConfigFieldControl
					key={fieldName(configField)}
					configField={configField}
					disabled={disabled}
				/>
			))}
		</Stack>
	);
};

/**
 * The "you have left these blank" advisory, in its own component on purpose.
 *
 * It needs the live value of every config field, and subscribing to that from
 * the step would re-render fifteen text inputs on every keystroke. Isolated
 * here, only this one paragraph re-renders.
 */
export const RecommendedConfigGaps = ({
	lmsClientClass,
}: {
	lmsClientClass?: string | null;
}) => {
	const { t } = useTranslation();
	const { control } = useFormContext();
	const values = useWatch({ control, name: "clientConfigFields" });

	const gaps = missingRecommendedClientConfig(lmsClientClass, values ?? {});
	if (gaps.length === 0) return null;

	return (
		<Alert severity="info">
			<AlertTitle>
				{t("hostlms.config_fields.recommended_missing_title")}
			</AlertTitle>
			{t("hostlms.config_fields.recommended_missing_body", {
				fields: gaps.map((problem) => t(problem.labelKey)).join(", "),
			})}
		</Alert>
	);
};

export default function ClientConfigFields({
	lmsClientClass,
	disabled = false,
}: {
	lmsClientClass?: string | null;
	disabled?: boolean;
}) {
	const profile = getHostLmsProfile(lmsClientClass);
	if (!profile) return null;

	return (
		<Stack spacing={3}>
			{profile.groups.map((group) => (
				<ConfigGroup key={group.id} group={group} disabled={disabled} />
			))}
		</Stack>
	);
}
