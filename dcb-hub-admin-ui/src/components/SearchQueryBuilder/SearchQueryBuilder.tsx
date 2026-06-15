import { useTranslation } from "react-i18next";
import { Add, Delete, Search as SearchIcon, Info } from "@mui/icons-material";
import {
	Button,
	IconButton,
	TextField,
	Box,
	Select,
	MenuItem,
	FormControl,
	InputLabel,
	SelectChangeEvent,
	Tooltip,
	Alert,
	Stack,
} from "@mui/material";

import { useSearchStore } from "@hooks/useSearchStore";
import { SearchField } from "@models/SearchField";
import { SearchCriterion } from "@models/SearchCriterion";

interface SearchQueryBuilderProps {
	onSearch: () => void;
}

export const SearchQueryBuilder = ({ onSearch }: SearchQueryBuilderProps) => {
	const { t } = useTranslation();
	const {
		criteria,
		addCriterion,
		removeCriterion,
		updateCriterion,
		setCriteria,
	} = useSearchStore();

	// Check if the current search is an exclusive UUID search
	const isUuidSearch =
		criteria.length === 1 && criteria[0].field === SearchField.ClusterRecordID;

	const handleAddCriterion = () => addCriterion();
	const handleRemoveCriterion = (id: string) => removeCriterion(id);

	// Handle the special case for ClusterRecordID
	const handleCriterionChange = (
		id: string,
		field: keyof Omit<SearchCriterion, "id">,
		value: string,
	) => {
		if (field === "field" && value === SearchField.ClusterRecordID) {
			const currentCriterion = criteria.find((c) => c.id === id);
			if (currentCriterion) {
				// Replace the entire criteria array with just this one to satisfy exclusive UUID rule
				setCriteria([
					{
						...currentCriterion,
						field: value as SearchField,
						value: currentCriterion.value.trim(),
					},
				]);
			}
		} else if (
			field === "value" &&
			criteria.find((c) => c.id === id)?.field === SearchField.ClusterRecordID
		) {
			// For ClusterRecordID, ensure we trim the value and don't allow trailing spaces
			const cleanValue = value.trim();
			updateCriterion(id, field, cleanValue);
		} else {
			updateCriterion(id, field, value);
		}
	};

	const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
		if (event.key === "Enter") {
			onSearch();
		}
	};

	const getPlaceholder = (field: SearchField) => {
		if (field === SearchField.ClusterRecordID) {
			return "e.g., 966ac8ca-12e8-4f95-81e3-8c9a0eb20500";
		}
		return t("general.search");
	};

	// Universal UUID validation regex (v1-v5 compliant)
	const uuidRegex =
		/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

	return (
		<Stack spacing={2} sx={{ width: "100%", mb: 2 }}>
			{/* Informative alert for exclusive UUID searches */}
			{isUuidSearch && (
				<Alert severity="info" icon={<Info />}>
					{t(
						"search.uuid_search_info",
						"Cluster Record UUID search allows only a single search criterion. Enter a valid UUID to search for a specific record.",
					)}
				</Alert>
			)}

			{criteria.map((criterion, index) => {
				const isInvalidUuid =
					criterion.field === SearchField.ClusterRecordID &&
					criterion.value.trim() !== "" &&
					!uuidRegex.test(criterion.value);

				return (
					<Stack
						key={criterion.id}
						direction="row"
						spacing={1.5}
						alignItems="center"
						sx={{ width: "100%" }}
					>
						{index > 0 && !isUuidSearch && (
							<FormControl size="small" sx={{ minWidth: 90 }}>
								<Select
									value={criterion.operator}
									onChange={(e: SelectChangeEvent<"AND" | "OR" | "NOT">) =>
										handleCriterionChange(
											criterion.id,
											"operator",
											e.target.value,
										)
									}
									inputProps={{
										"aria-label": t("search.aria.select_operator"),
									}}
								>
									<MenuItem value="AND">AND</MenuItem>
									<MenuItem value="OR">OR</MenuItem>
									<MenuItem value="NOT">NOT</MenuItem>
								</Select>
							</FormControl>
						)}

						<FormControl size="small" sx={{ minWidth: 160 }}>
							<InputLabel id={`field-label-${criterion.id}`}>
								{t("ui.info.field")}
							</InputLabel>
							<Select
								labelId={`field-label-${criterion.id}`}
								value={criterion.field}
								label={t("ui.info.field")}
								onChange={(e: SelectChangeEvent<SearchField>) =>
									handleCriterionChange(criterion.id, "field", e.target.value)
								}
								inputProps={{ "aria-label": t("ui.info.field") }}
							>
								<MenuItem value={SearchField.Keyword}>
									{t("search.keyword")}
								</MenuItem>
								<MenuItem value={SearchField.Title}>
									{t("search.title")}
								</MenuItem>
								<MenuItem value={SearchField.Author}>
									{t("search.author")}
								</MenuItem>
								<MenuItem value={SearchField.ISBN}>{t("search.isbn")}</MenuItem>
								<MenuItem value={SearchField.ISSN}>{t("search.issn")}</MenuItem>
								<MenuItem value={SearchField.Subject}>
									{t("search.subject")}
								</MenuItem>
								<MenuItem value={SearchField.Language}>
									{t("search.language")}
								</MenuItem>
								<MenuItem value={SearchField.Format}>
									{t("search.format")}
								</MenuItem>
								<MenuItem value={SearchField.Publisher}>
									{t("search.publisher")}
								</MenuItem>
								<MenuItem value={SearchField.ClusterRecordID}>
									{t("details.cluster_record_uuid")}
								</MenuItem>
							</Select>
						</FormControl>

						<TextField
							size="small"
							fullWidth
							placeholder={getPlaceholder(criterion.field)}
							value={criterion.value}
							onChange={(e) =>
								handleCriterionChange(criterion.id, "value", e.target.value)
							}
							onKeyDown={handleKeyDown}
							error={isInvalidUuid}
							helperText={
								isInvalidUuid
									? t("search.invalid_uuid", "Please enter a valid UUID")
									: undefined
							}
						/>

						{criteria.length > 1 && !isUuidSearch && (
							<IconButton
								onClick={() => handleRemoveCriterion(criterion.id)}
								aria-label={t("search.aria.remove_criterion")}
								color="error"
							>
								<Delete />
							</IconButton>
						)}
					</Stack>
				);
			})}

			<Box display="flex" gap={1.5}>
				<Tooltip
					title={
						isUuidSearch
							? t(
									"search.uuid_search_exclusive",
									"UUID search allows only one search criterion",
								)
							: t("search.add_field_tooltip")
					}
				>
					<span>
						<Button
							startIcon={<Add />}
							onClick={handleAddCriterion}
							variant="outlined"
							color="primary"
							disabled={isUuidSearch}
						>
							{t("search.add_field")}
						</Button>
					</span>
				</Tooltip>
				<Button
					startIcon={<SearchIcon />}
					onClick={onSearch}
					variant="contained"
					color="primary"
				>
					{t("general.search")}
				</Button>
			</Box>
		</Stack>
	);
};
