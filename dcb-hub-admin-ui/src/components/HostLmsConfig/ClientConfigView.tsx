import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { Grid, Stack, Typography } from "@mui/material";
import { ExpandMore } from "@mui/icons-material";

import PrivateData from "@components/PrivateData/PrivateData";
import {
	SubAccordion,
	SubAccordionDetails,
	SubAccordionSummary,
} from "@components/StyledAccordion/StyledAccordion";
import {
	type ClientConfigField,
	type ClientConfigGroup,
	clientConfigToFields,
	effectiveClientConfigValue,
	fieldName,
	getHostLmsProfile,
} from "@helpers/hostLmsClientConfig";

import ConfigItem from "./ConfigItem";

const GRID_COLUMNS = { xs: 3, sm: 6, md: 9, lg: 12 };
const GRID_SPACING = { xs: 2, md: 3 };
const CELL_SIZE = { xs: 2, sm: 4, md: 4 };

const displayValue = (
	configField: ClientConfigField,
	value: unknown,
	t: TFunction,
): { text: string; tooltip?: string } => {
	switch (configField.type) {
		case "stringList":
			return { text: Array.isArray(value) ? value.join(", ") : String(value) };
		case "jsonObject": {
			const entries =
				value && typeof value === "object" ? Object.entries(value) : [];
			const optionLabel = (option: unknown) => {
				const match = configField.valueOptions?.find(
					(candidate) => candidate.value === option,
				);
				return match ? t(match.labelKey) : String(option);
			};
			return {
				text: t("hostlms.client_config.entry_count", { count: entries.length }),
				tooltip: entries
					.map(([key, option]) => `${key}: ${optionLabel(option)}`)
					.join(", "),
			};
		}
		case "select": {
			const match = configField.options?.find(
				(option) => option.value === String(value),
			);
			return { text: match ? t(match.labelKey) : String(value) };
		}
		case "boolean":
			return { text: String(value === true || value === "true") };
		default:
			return { text: String(value) };
	}
};

function FieldView({
	configField,
	config,
}: {
	configField: ClientConfigField;
	config: unknown;
}) {
	const { t } = useTranslation();
	const label = t(configField.labelKey);
	const stored = effectiveClientConfigValue(config, configField);

	if (configField.type === "secret") {
		if (stored === undefined) return null;
		return (
			<Grid size={CELL_SIZE}>
				<PrivateData
					clientConfigType={label}
					hiddenTextValue={String(stored)}
					id={`client-config-${fieldName(configField).replace(/\W/g, "-")}`}
				/>
			</Grid>
		);
	}

	const value = stored ?? configField.defaultValue;
	if (value === undefined) return null;
	const { text, tooltip } = displayValue(configField, value, t);

	return (
		<ConfigItem
			title={label}
			value={
				stored === undefined
					? t("hostlms.client_config.default_value", { value: text })
					: text
			}
			tooltip={tooltip}
			type={configField.type === "url" ? "url" : undefined}
		/>
	);
}

const isNested = (group: ClientConfigGroup): boolean =>
	group.id !== "" &&
	group.fields.every((configField) => configField.path[0] === group.id);

function GroupView({
	group,
	config,
	values,
}: {
	group: ClientConfigGroup;
	config: unknown;
	values: Record<string, unknown>;
}) {
	const { t } = useTranslation();
	const fields = group.fields.filter(
		(configField) =>
			(!configField.shownWhen || configField.shownWhen(values)) &&
			(configField.defaultValue !== undefined ||
				effectiveClientConfigValue(config, configField) !== undefined),
	);
	if (fields.length === 0) return null;

	const cells = (
		<Grid container spacing={GRID_SPACING} columns={GRID_COLUMNS}>
			{fields.map((configField) => (
				<FieldView
					key={fieldName(configField)}
					configField={configField}
					config={config}
				/>
			))}
		</Grid>
	);
	const heading = group.labelKey && (
		<Typography variant="h3" sx={{ fontWeight: "bold" }}>
			{t(group.labelKey)}
		</Typography>
	);

	if (isNested(group)) {
		return (
			<SubAccordion variant="outlined" disableGutters>
				<SubAccordionSummary expandIcon={<ExpandMore />}>
					{heading}
				</SubAccordionSummary>
				<SubAccordionDetails>{cells}</SubAccordionDetails>
			</SubAccordion>
		);
	}

	return (
		<Stack spacing={2}>
			{heading}
			{cells}
		</Stack>
	);
}

/**
 * A Host LMS's client config, read through the same profile the edit form writes, so
 * every setting that can be edited is shown and the version gates apply to both.
 */
export default function ClientConfigView({
	lmsClientClass,
	config,
}: {
	lmsClientClass: string | null | undefined;
	config: Record<string, unknown> | null | undefined;
}) {
	const { t } = useTranslation();
	const profile = getHostLmsProfile(lmsClientClass);
	const { values, unmappedKeys } = clientConfigToFields(
		lmsClientClass,
		config ?? {},
	);

	return (
		<Stack spacing={3}>
			{profile?.groups
				.filter((group) => !group.shownWhen || group.shownWhen(values))
				.map((group) => (
					<GroupView
						key={group.id || "main"}
						group={group}
						config={config}
						values={values}
					/>
				))}
			{/* Names only: an unrecognised key may hold a credential */}
			{unmappedKeys.length > 0 && (
				<Grid container spacing={GRID_SPACING} columns={GRID_COLUMNS}>
					<ConfigItem
						title={t("hostlms.client_config.other_settings")}
						value={unmappedKeys.join(", ")}
					/>
				</Grid>
			)}
		</Stack>
	);
}
