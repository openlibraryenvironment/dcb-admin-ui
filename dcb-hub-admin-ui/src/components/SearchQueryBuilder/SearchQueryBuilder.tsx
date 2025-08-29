import { useSearchStore } from "src/hooks/useSearchStore";
import { useTranslation } from "next-i18next";
import { Add, Delete, Search as SearchIcon } from "@mui/icons-material";
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
} from "@mui/material";
import { SearchField } from "@models/SearchField";
import { SearchCriterion } from "@models/SearchCriterion";

export const SearchQueryBuilder = ({ onSearch }: { onSearch: () => void }) => {
	const { t } = useTranslation();
	// Read state and actions from the Zustand store
	const { criteria, addCriterion, removeCriterion, updateCriterion } =
		useSearchStore();

	const handleAddCriterion = () => addCriterion();
	const handleRemoveCriterion = (id: string) => removeCriterion(id);

	const handleCriterionChange = (
		id: string,
		field: keyof Omit<SearchCriterion, "id">,
		value: string,
	) => {
		updateCriterion(id, field, value);
	};

	const handleSearch = () => {
		onSearch(); // We want to handle the actual search in the parent
	};

	const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
		if (event.key === "Enter") {
			handleSearch();
		}
	};
	return (
		<Box display="flex" flexDirection="column" gap={2} mb={2}>
			{criteria.map((criterion, index) => (
				<Box key={criterion.id} display="flex" alignItems="center" gap={1}>
					{index > 0 && (
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
								inputProps={{
									"aria-label": "Select operator",
								}}
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
							inputProps={{
								"aria-label": "field",
							}}
						>
							<MenuItem value={SearchField.Keyword}>
								{t("search.keyword")}
								{/**Unknown what Lucene equivalent is. May have to switch between the two. ID searches also unclear */}
							</MenuItem>
							<MenuItem value={SearchField.Title}>{t("search.title")}</MenuItem>
							{/**Works with both*/}
							<MenuItem value={SearchField.Author}>
								{t("search.author")}
								{/**Works with CQL, Lucene unknown. May map to agents*/}
							</MenuItem>
							<MenuItem value={SearchField.ISBN}>{t("search.isbn")}</MenuItem>
							<MenuItem value={SearchField.ISSN}>{t("search.issn")}</MenuItem>
							{/** Both work with CQL, Lucene unknown but probably maps to identifiers*/}
							<MenuItem value={SearchField.Subject}>
								{t("search.subject")}
								{/** Works with CQL, Lucene unknown. Free text could cause issues. May have problems with AND */}
							</MenuItem>
							<MenuItem value={SearchField.Language}>
								{t("search.language")}
								{/** Works with CQL, Lucene unknown. Needs to be a drop-down that translates "Spanish" into spa. Flags etc */}
							</MenuItem>
							<MenuItem value={SearchField.Format}>
								{t("search.format")}
								{/** Works with CQL, Lucene unknown. May have issues with AND */}
							</MenuItem>
							{/* <MenuItem value={SearchField.PublicationYear}>
								{t("search.publication_year")}
							</MenuItem> */}
							{/** Can be done, but needs Lucene. Lucene gives us range support also. */}
							<MenuItem value={SearchField.Publisher}>
								{t("search.publisher")}
							</MenuItem>
							{/* Works with CQL, should work with lucene  */}
							{/* <MenuItem value={SearchField.Library}>
								{t("libraries.library")}
								{/** HIGHLY EXPERIMENTAL - DEPENDS ON LOCATION DATA. Think we can only do this via CQL */}
							{/* </MenuItem> */}
						</Select>
					</FormControl>
					<TextField
						size="small"
						fullWidth
						placeholder={t("general.search")}
						value={criterion.value}
						onChange={(e) =>
							handleCriterionChange(criterion.id, "value", e.target.value)
						}
						onKeyDown={handleKeyDown}
					/>
					{criteria.length > 1 && (
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
					title={t("search.add_field_tooltip")}
					key={t("search.add_field_tooltip")}
				>
					<Button
						startIcon={<Add />}
						onClick={handleAddCriterion}
						variant="outlined"
						color="primary"
					>
						{t("search.add_field")}
					</Button>
				</Tooltip>
				{/** We should disable search button if nothing in search */}
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
