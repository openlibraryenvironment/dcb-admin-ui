import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import { AdminLayout } from "@layout";
import { GetServerSideProps, NextPage } from "next";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import axios from "axios";
import { useSession } from "next-auth/react";
import Link from "@components/Link/Link";
import { Add, Delete, Search as SearchIcon } from "@mui/icons-material";
import Error from "@components/Error/Error";
import {
	DataGridPremium,
	GridColDef,
	GridFilterModel,
	GridPaginationModel,
} from "@mui/x-data-grid-premium";
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
import { CustomNoDataOverlay } from "@components/ServerPaginatedGrid/components/DynamicOverlays";
import getConfig from "next/config";
import { v4 as uuidv4 } from "uuid";
import { SearchField } from "@models/SearchField";
import { SearchCriterion } from "@models/SearchCriterion";
import { formatQueryPart } from "src/helpers/search/formatQueryPart";

// Need to stop firing query on session. Should only happen on keydown or search clicked
// Need to standardise all of this
// SearchQueryBuilder in its own component, helpers to helper functions etc
// And we need to integrate it with the Grid Filter Model so that removing a filter auto-changes the search without having to make a new one.
// When we get a UUID, we need to switch to instance search
// But when we get a title we need to do title/keyword search
// Filters === "Advanced Search" in Locate
// Lucene and "search modes" out of scope for now - search options are the order of the day
// Make language search catch things like "english" and "spanish" and "espanol" and translate them to "eng", "spa"
// Try and match DCB Admin for Libraries as much as possible so migration from next is easier

// CQL by default, but lucene may make these things easier
// --- SearchQueryBuilder Component ---
const SearchQueryBuilder = ({
	onSearch,
}: {
	onSearch: (query: string) => void;
}) => {
	const { t } = useTranslation();
	const [criteria, setCriteria] = useState<SearchCriterion[]>([
		{
			id: uuidv4(),
			field: SearchField.Keyword,
			value: "",
			operator: "AND",
		},
	]);

	const handleAddCriterion = () => {
		setCriteria([
			...criteria,
			{
				id: uuidv4(),
				field: SearchField.Title,
				value: "",
				operator: "AND",
			},
		]);
	};

	const handleRemoveCriterion = (id: string) => {
		setCriteria(criteria.filter((c) => c.id !== id));
	};

	const handleCriterionChange = (
		id: string,
		field: keyof Omit<SearchCriterion, "id">,
		value: string,
	) => {
		setCriteria(
			criteria.map((c) => (c.id === id ? { ...c, [field]: value } : c)),
		);
	};

	const handleSearch = () => {
		const query = criteria
			.filter((c) => c.value.trim() !== "") // Ignore empty fields
			.map((c, index, array) => {
				const queryPart = formatQueryPart(c.field, c.value);
				console.log(array);
				// Don't add operator for the first item
				return index > 0 ? `${c.operator} (${queryPart})` : `(${queryPart})`;
			})
			.join(" ");
		onSearch(query);
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
									"aria-label": t("search.operator_selection"),
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
							<MenuItem value={SearchField.Library}>
								{t("libraries.library")}
								{/** HIGHLY EXPERIMENTAL - DEPENDS ON LOCATION DATA. Think we can only do this via CQL */}
							</MenuItem>
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
				{/** Disable search button if blank */}
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

// --- Main Search Page Component ---
const Search: NextPage = () => {
	const router = useRouter();
	const { t } = useTranslation();
	const { data: session } = useSession();
	const { publicRuntimeConfig } = getConfig();

	const [searchResults, setSearchResults] = useState<any>({
		instances: [],
		totalRecords: 0,
	});

	const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
		page: 0,
		pageSize: 25,
	});

	const [filterModel, setFilterModel] = useState<GridFilterModel>({
		items: [],
	});
	const [mainQuery, setMainQuery] = useState<string>("");

	const columns: GridColDef[] = [
		{
			field: "title",
			headerName: t("ui.data_grid.title"),
			minWidth: 300,
			flex: 0.7,
		},
		{
			field: "id",
			headerName: t("search.cluster_id"),
			minWidth: 100,
			flex: 0.5,
			renderCell: (params) => (
				<Link href={`/search/${params.row.id}/cluster`}>{params.row.id}</Link>
			),
		},
		{
			field: "items",
			headerName: t("search.items"),
			minWidth: 100,
			flex: 0.3,
			renderCell: (params) => (
				<Link href={`/search/${params.row.id}/items`}>
					{t("ui.data_grid.view_items")}
				</Link>
			),
		},
		{
			field: "identifiers",
			headerName: t("search.identifiers"),
			minWidth: 100,
			flex: 0.3,
			renderCell: (params) => (
				<Link href={`/search/${params.row.id}/identifiers`}>
					{t("search.identifiers")}
				</Link>
			),
		},
	];
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(false);

	const fetchRecords = useCallback(
		async (query: string, page: number, pageSize: number) => {
			if (
				!session?.accessToken ||
				!query ||
				!publicRuntimeConfig.DCB_SEARCH_BASE
			)
				return;

			setLoading(true);
			const requestURL = `${publicRuntimeConfig.DCB_SEARCH_BASE}/search/instances`;
			const queryParams = {
				query: query,
				offset: page * pageSize,
				limit: pageSize,
			};

			try {
				const response = await axios.get(requestURL, {
					headers: { Authorization: `Bearer ${session.accessToken}` },
					params: queryParams,
				});
				if (response.data.instances) {
					setSearchResults({
						instances: response.data.instances,
						totalRecords: response.data.totalRecords,
					});
				} else {
					setSearchResults({ instances: [], totalRecords: 0 });
				}
			} catch (error) {
				console.error(error);
				setError(true);
				setSearchResults({ instances: [], totalRecords: 0 });
			} finally {
				setLoading(false);
			}
		},
		[session?.accessToken, publicRuntimeConfig.DCB_SEARCH_BASE],
	);

	const handleSearchTrigger = (query: string) => {
		setMainQuery(query);
		router.push(`/search?q=${encodeURIComponent(query)}`, undefined, {
			shallow: true,
		});
	};

	console.log(filterModel);

	// This is the bit that doesn't look like it is working
	// We probably also need to do better at detecting IDs
	useEffect(() => {
		// This effect combines the main query and grid filters
		const gridFilterQuery = filterModel.items
			.filter((item) => item.value) // Ensure filter has a value
			.map((item) => {
				// Map grid field to a searchable field type.
				// This assumes a direct mapping. You might need to adjust this logic.
				const field = (item.field as SearchField) || SearchField.Title;
				return formatQueryPart(field, item.value);
			})
			.join(` ${filterModel.logicOperator?.toUpperCase() || "AND"} `);

		let combinedQuery = mainQuery;
		if (mainQuery && gridFilterQuery) {
			combinedQuery = `(${mainQuery}) AND (${gridFilterQuery})`;
		} else if (gridFilterQuery) {
			combinedQuery = gridFilterQuery;
		}

		if (combinedQuery) {
			fetchRecords(
				combinedQuery,
				paginationModel.page,
				paginationModel.pageSize,
			);
		} else {
			setSearchResults({ instances: [], totalRecords: 0 });
		}
	}, [mainQuery, filterModel, paginationModel, fetchRecords]);

	useEffect(() => {
		// Effect to run search when query param changes (e.g., on page load)
		const queryFromUrl = router.query.q as string;
		if (queryFromUrl && queryFromUrl !== mainQuery) {
			setMainQuery(queryFromUrl);
		}
	}, [router.query.q, mainQuery]);

	const rows = searchResults.instances || [];

	return publicRuntimeConfig.DCB_SEARCH_BASE ? (
		<AdminLayout title={t("nav.search.name")}>
			<SearchQueryBuilder onSearch={handleSearchTrigger} />
			{error ? (
				<Error
					title={t("ui.error.search_failed")}
					message={t("ui.info.connection_issue")}
					description={t("ui.info.reload")}
					action={t("ui.action.reload")}
					reload
				/>
			) : (
				<DataGridPremium
					rows={rows}
					columns={columns}
					pagination
					paginationMode="server"
					paginationModel={paginationModel}
					onPaginationModelChange={setPaginationModel}
					filterMode="server"
					filterModel={filterModel}
					onFilterModelChange={setFilterModel}
					pageSizeOptions={[10, 25, 50, 100, 200]}
					rowCount={searchResults.totalRecords}
					loading={loading}
					autoHeight
					getRowId={(row) => row.id}
					sx={{ border: 0 }}
					slots={{
						noRowsOverlay: () => (
							<CustomNoDataOverlay noDataMessage={t("search.no_data")} />
						),
					}}
					disableAggregation={true}
					disableRowGrouping={true}
				/>
			)}
		</AdminLayout>
	) : (
		<AdminLayout title={t("nav.search.name")}>
			<Error
				title={t("search.shared_index_unavailable_title")}
				message={t("search.shared_index_unavailable_message")}
				action={t("ui.action.go_back")}
			/>
		</AdminLayout>
	);
};

export const getServerSideProps: GetServerSideProps = async (context) => {
	const { locale } = context;

	let translations = {};
	if (locale) {
		translations = await serverSideTranslations(locale as string, [
			"common",
			"application",
			"validation",
		]);
	}
	return {
		props: {
			...translations,
		},
	};
};

export default Search;
