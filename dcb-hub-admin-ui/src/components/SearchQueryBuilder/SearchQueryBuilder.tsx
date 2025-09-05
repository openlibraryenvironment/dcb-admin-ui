import { useSearchStore } from "src/hooks/useSearchStore";
import { useTranslation } from "next-i18next";
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
} from "@mui/material";
import { SearchField } from "@models/SearchField";
import { SearchCriterion } from "@models/SearchCriterion";

export const SearchQueryBuilder = ({ onSearch }: { onSearch: () => void }) => {
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
		// If the user selects "Cluster Record UUID", make it the ONLY criterion.
		if (field === "field" && value === SearchField.ClusterRecordID) {
			const currentCriterion = criteria.find((c) => c.id === id);
			if (currentCriterion) {
				// Replace the entire criteria array with just this one
				setCriteria([
					{
						...currentCriterion,
						field: value,
						value: currentCriterion.value.trim(),
					},
				]);
			}
		} else if (
			field === "value" &&
			criteria.find((c) => c.id === id)?.field === SearchField.ClusterRecordID
		) {
			// For ClusterRecordID, ensure we trim the value and don't allow any extra characters
			const cleanValue = value.trim();
			updateCriterion(id, field, cleanValue);
		} else {
			// Otherwise, update the criterion normally
			updateCriterion(id, field, value);
		}
	};

	const handleSearch = () => {
		onSearch();
	};

	const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
		if (event.key === "Enter") {
			handleSearch();
		}
	};

	// Get placeholder text based on selected field
	const getPlaceholder = (field: SearchField) => {
		if (field === SearchField.ClusterRecordID) {
			return "e.g., 966ac8ca-12e8-4f95-81e3-8c9a0eb20500";
		}
		return t("general.search");
	};

	return (
		<Box display="flex" flexDirection="column" gap={2} mb={2}>
			{/* Show info alert for UUID search */}
			{isUuidSearch && (
				<Alert severity="info" icon={<Info />} sx={{ mb: 1 }}>
					{t(
						"search.uuid_search_info",
						"Cluster Record UUID search allows only a single search criterion. Enter a valid UUID to search for a specific record.",
					)}
				</Alert>
			)}

			{criteria.map((criterion, index) => (
				<Box key={criterion.id} display="flex" alignItems="center" gap={1}>
					{index > 0 && !isUuidSearch && (
						<FormControl size="small" sx={{ minWidth: 80 }}>
							<Select
								value={criterion.operator}
								onChange={(e: SelectChangeEvent<"AND" | "OR" | "NOT">) =>
									handleCriterionChange(
										criterion.id,
										"operator",
										e.target.value,
									)
								}
								inputProps={{ "aria-label": "Select operator" }}
							>
								<MenuItem value="AND">AND</MenuItem>
								<MenuItem value="OR">OR</MenuItem>
								<MenuItem value="NOT">NOT</MenuItem>
							</Select>
						</FormControl>
					)}
					<FormControl size="small" sx={{ minWidth: 120 }} title="Field">
						<InputLabel>{t("ui.info.field")}</InputLabel>
						<Select
							value={criterion.field}
							label="Field"
							title="Field"
							onChange={(e: SelectChangeEvent<SearchField>) =>
								handleCriterionChange(criterion.id, "field", e.target.value)
							}
							inputProps={{ "aria-label": "field" }}
						>
							<MenuItem value={SearchField.Keyword}>
								{t("search.keyword")}
							</MenuItem>
							<MenuItem value={SearchField.Title}>{t("search.title")}</MenuItem>
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
						// Add validation for UUID field
						error={
							criterion.field === SearchField.ClusterRecordID &&
							criterion.value.trim() !== "" &&
							!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
								criterion.value,
							)
						}
						helperText={
							criterion.field === SearchField.ClusterRecordID &&
							criterion.value.trim() !== "" &&
							!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
								criterion.value,
							)
								? t("search.invalid_uuid", "Please enter a valid UUID")
								: undefined
						}
					/>
					{criteria.length > 1 && !isUuidSearch && (
						<IconButton
							onClick={() => handleRemoveCriterion(criterion.id)}
							aria-label="remove criterion"
						>
							<Delete />
						</IconButton>
					)}
				</Box>
			))}
			<Box display="flex" gap={1}>
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
					onClick={handleSearch}
					variant="contained"
					color="primary"
				>
					{t("general.search")}
				</Button>
			</Box>
		</Box>
	);
};
