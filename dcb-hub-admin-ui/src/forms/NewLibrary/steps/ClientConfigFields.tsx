import { ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import {
	Accordion,
	AccordionDetails,
	AccordionSummary,
	Alert,
	AlertTitle,
	Button,
	Checkbox,
	FormControl,
	FormControlLabel,
	FormGroup,
	FormHelperText,
	FormLabel,
	IconButton,
	InputAdornment,
	Link,
	MenuItem,
	Stack,
	TextField,
	Typography,
} from "@mui/material";
import {
	Add,
	Delete,
	ExpandMore,
	Visibility,
	VisibilityOff,
} from "@mui/icons-material";

import {
	type ClientConfigField,
	type ClientConfigOption,
	type ClientConfigGroup,
	fieldName,
	getHostLmsProfile,
	isAdvancedField,
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
		getValues,
		setValue,
		formState: { errors },
	} = useFormContext();

	const name = fieldName(configField);
	const inputId = `client-config-${name.replace(/\./g, "-")}`;
	const label = t(configField.labelKey);
	const error = errorAt(errors, configField.path);
	// "Recommended" is not the same as optional: creation succeeds, then the
	// first real request fails. Say which one this is.
	const explanation =
		configField.requirement === "recommended"
			? `${t("hostlms.config_fields.recommended")} - ${t(configField.descriptionKey)}`
			: t(configField.descriptionKey);
	const description =
		configField.defaultValue !== undefined && configField.type !== "boolean"
			? `${explanation} ${t("hostlms.config_fields.leave_blank_for_default", {
					value: configField.defaultValue,
				})}`
			: explanation;
	const placeholder = configField.defaultValue ?? configField.placeholder;
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

	if (configField.type === "jsonObject" && configField.valueOptions) {
		return (
			<Controller
				name={`clientConfigFields.${name}`}
				control={control}
				render={({ field }) => (
					<KeyedChoiceRows
						inputId={inputId}
						label={label}
						helperText={helperText}
						value={field.value}
						onChange={field.onChange}
						valueOptions={configField.valueOptions ?? []}
						disabled={disabled}
					/>
				)}
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
						placeholder={placeholder}
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

	if (configField.type === "select") {
		return (
			<Controller
				name={`clientConfigFields.${name}`}
				control={control}
				render={({ field }) => {
					const value = field.value ?? "";
					const known = configField.options?.some(
						(option) => option.value === value,
					);

					return (
						<TextField
							{...field}
							value={value}
							id={inputId}
							select
							label={label}
							fullWidth
							disabled={disabled}
							required={configField.requirement === "required"}
							error={!!error}
							helperText={error ?? helperText}
						>
							{configField.requirement !== "required" && (
								<MenuItem value="">
									{t("hostlms.config_fields.use_default")}
								</MenuItem>
							)}
							{configField.options?.map((option) => (
								<MenuItem key={option.value} value={option.value}>
									{t(option.labelKey)}
								</MenuItem>
							))}
							{/* A stored value outside the set, shown so it can be corrected */}
							{value !== "" && !known && (
								<MenuItem value={value}>{value}</MenuItem>
							)}
						</TextField>
					);
				}}
			/>
		);
	}

	if (configField.type === "stringList" && configField.options) {
		return (
			<Controller
				name={`clientConfigFields.${name}`}
				control={control}
				render={({ field }) => {
					const chosen: string[] = Array.isArray(field.value)
						? field.value
						: String(field.value ?? "")
								.split(",")
								.map((entry) => entry.trim())
								.filter((entry) => entry !== "");

					return (
						<FormControl component="fieldset" disabled={disabled}>
							<FormLabel component="legend">{label}</FormLabel>
							<FormGroup>
								{configField.options?.map((option) => (
									<FormControlLabel
										key={option.value}
										label={t(option.labelKey)}
										control={
											<Checkbox
												checked={chosen.includes(option.value)}
												onChange={(event) =>
													field.onChange(
														event.target.checked
															? [...chosen, option.value]
															: chosen.filter(
																	(value) => value !== option.value,
																),
													)
												}
												slotProps={{
													input: {
														"aria-describedby": `${inputId}-helper-text`,
													},
												}}
											/>
										}
									/>
								))}
							</FormGroup>
							<FormHelperText id={`${inputId}-helper-text`}>
								{helperText}
							</FormHelperText>
						</FormControl>
					);
				}}
			/>
		);
	}

	// Stored as an array, typed as a comma-separated list. Arrays only reach
	// this input when hydrated from the JSON editor.
	const isList = configField.type === "stringList";
	const derives = configField.derives;

	return (
		<Controller
			name={`clientConfigFields.${name}`}
			control={control}
			render={({ field }) => (
				<TextField
					{...field}
					onChange={(event) => {
						if (derives) {
							const target = `clientConfigFields.${derives.path.join(".")}`;
							const current = getValues(target) ?? "";
							if (
								current === "" ||
								current === derives.from(field.value ?? "")
							) {
								setValue(target, derives.from(event.target.value));
							}
						}
						field.onChange(event);
					}}
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
					placeholder={placeholder}
					type={
						configField.type === "url" || configField.type === "email"
							? configField.type
							: "text"
					}
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

const asEntries = (value: unknown): [string, string][] => {
	let object: unknown = value;
	if (typeof value === "string") {
		try {
			object = value.trim() ? JSON.parse(value) : {};
		} catch {
			object = {};
		}
	}
	return object && typeof object === "object" && !Array.isArray(object)
		? Object.entries(object as Record<string, unknown>).map(([key, choice]) => [
				key,
				String(choice),
			])
		: [];
};

/**
 * A map from the site's own names to one of a closed set, edited as rows. A row with no
 * name yet is kept on screen but not written, so the stored object never has a "" key.
 */
const KeyedChoiceRows = ({
	inputId,
	label,
	helperText,
	value,
	onChange,
	valueOptions,
	disabled,
}: {
	inputId: string;
	label: string;
	helperText: ReactNode;
	value: unknown;
	onChange: (value: Record<string, string>) => void;
	valueOptions: readonly ClientConfigOption[];
	disabled: boolean;
}) => {
	const { t } = useTranslation();
	const [rows, setRows] = useState<[string, string][]>(() => asEntries(value));

	const update = (next: [string, string][]) => {
		setRows(next);
		onChange(
			Object.fromEntries(
				next
					.filter(([key]) => key.trim() !== "")
					.map(([key, choice]) => [key.trim(), choice]),
			),
		);
	};

	return (
		<FormControl component="fieldset" disabled={disabled}>
			<FormLabel component="legend">{label}</FormLabel>
			<FormHelperText id={`${inputId}-helper-text`}>
				{helperText}
			</FormHelperText>
			<Stack spacing={1} sx={{ mt: 1 }}>
				{rows.map(([key, choice], index) => (
					<Stack
						key={index}
						direction={{ xs: "column", sm: "row" }}
						spacing={1}
					>
						<TextField
							id={`${inputId}-key-${index}`}
							label={t("hostlms.config_fields.shelf_location")}
							value={key}
							onChange={(event) =>
								update(
									rows.map((row, at) =>
										at === index ? [event.target.value, row[1]] : row,
									),
								)
							}
							fullWidth
						/>
						<TextField
							id={`${inputId}-value-${index}`}
							select
							label={t("hostlms.config_fields.loan_policy")}
							value={choice}
							onChange={(event) =>
								update(
									rows.map((row, at) =>
										at === index ? [row[0], event.target.value] : row,
									),
								)
							}
							fullWidth
						>
							{valueOptions.map((option) => (
								<MenuItem key={option.value} value={option.value}>
									{t(option.labelKey)}
								</MenuItem>
							))}
						</TextField>
						<IconButton
							onClick={() => update(rows.filter((_row, at) => at !== index))}
							aria-label={t("hostlms.config_fields.remove_shelf_location", {
								location: key || index + 1,
							})}
						>
							<Delete />
						</IconButton>
					</Stack>
				))}
				<Button
					startIcon={<Add />}
					onClick={() => setRows([...rows, ["", valueOptions[0]?.value ?? ""]])}
					sx={{ alignSelf: "flex-start" }}
				>
					{t("hostlms.config_fields.add_shelf_location")}
				</Button>
			</Stack>
		</FormControl>
	);
};

const hasConditions = (group: ClientConfigGroup): boolean =>
	!!group.shownWhen ||
	group.fields.some((configField) => !!configField.shownWhen);

/**
 * A group whose fields depend on another answer (SIP2 or NCIP, JWT or not). Only these
 * subscribe to the values, so typing elsewhere does not re-render every group.
 */
const ConditionalGroup = ({
	group,
	disabled,
}: {
	group: ClientConfigGroup;
	disabled: boolean;
}) => {
	const { control } = useFormContext();
	const values = useWatch({ control, name: "clientConfigFields" }) ?? {};

	if (group.shownWhen && !group.shownWhen(values)) return null;

	return (
		<ConfigGroup
			group={{
				...group,
				shownWhen: undefined,
				fields: group.fields.filter(
					(configField) =>
						!configField.shownWhen || configField.shownWhen(values),
				),
			}}
			disabled={disabled}
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
	const basic = group.fields.filter(
		(configField) => !isAdvancedField(configField),
	);
	const advanced = group.fields.filter(isAdvancedField);

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
			{basic.map((configField) => (
				<ConfigFieldControl
					key={fieldName(configField)}
					configField={configField}
					disabled={disabled}
				/>
			))}
			{advanced.length > 0 && (
				<AdvancedFields
					groupId={group.id}
					fields={advanced}
					disabled={disabled}
				/>
			)}
		</Stack>
	);
};

/**
 * The settings the adapter defaults, out of the way. Opens itself when any of them already
 * has a value or an error, so nothing set is hidden and no message points at a closed panel.
 */
const AdvancedFields = ({
	groupId,
	fields,
	disabled,
}: {
	groupId: string;
	fields: ClientConfigField[];
	disabled: boolean;
}) => {
	const { t } = useTranslation();
	const {
		control,
		formState: { errors },
	} = useFormContext();
	const values = useWatch({ control, name: "clientConfigFields" });
	const [opened, setOpened] = useState(false);

	const needsAttention = fields.some(
		(configField) =>
			!!errorAt(errors, configField.path) ||
			readFieldValue(values, configField.path) !== "",
	);
	const summaryId = `client-config-advanced-${groupId || "main"}`;

	return (
		<Accordion
			expanded={opened || needsAttention}
			onChange={(_event, expanded) => setOpened(expanded)}
			disableGutters
			variant="outlined"
		>
			<AccordionSummary
				expandIcon={<ExpandMore />}
				id={`${summaryId}-summary`}
				aria-controls={`${summaryId}-details`}
			>
				<Typography>
					{t("hostlms.config_fields.advanced_settings", {
						count: fields.length,
					})}
				</Typography>
			</AccordionSummary>
			<AccordionDetails id={`${summaryId}-details`}>
				<Stack spacing={2}>
					{fields.map((configField) => (
						<ConfigFieldControl
							key={fieldName(configField)}
							configField={configField}
							disabled={disabled}
						/>
					))}
				</Stack>
			</AccordionDetails>
		</Accordion>
	);
};

const readFieldValue = (values: any, path: string[]): string => {
	const value = path.reduce(
		(current, segment) => (current == null ? undefined : current[segment]),
		values,
	);
	return value == null ? "" : String(value).trim();
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
			{profile.groups.map((group) =>
				hasConditions(group) ? (
					<ConditionalGroup key={group.id} group={group} disabled={disabled} />
				) : (
					<ConfigGroup key={group.id} group={group} disabled={disabled} />
				),
			)}
		</Stack>
	);
}
