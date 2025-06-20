import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import { debounce } from "lodash";
import { AdminLayout } from "@layout";
import { GetServerSideProps, NextPage } from "next";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import axios from "axios";
import { useSession } from "next-auth/react";
import Link from "@components/Link/Link";
import { Clear, Search as SearchIcon } from "@mui/icons-material";
import Error from "@components/Error/Error";
import {
	DataGridPremium,
	GridColDef,
	GridPaginationModel,
} from "@mui/x-data-grid-premium";
import { IconButton, InputAdornment, TextField } from "@mui/material";
import { CustomNoDataOverlay } from "@components/ServerPaginatedGrid/components/DynamicOverlays";
import getConfig from "next/config";
import { validate } from "uuid";

const debouncedSearchFunction = debounce(
	(term: string, callback: (term: string) => void) => {
		callback(term);
	},
	300,
);

const SearchBar = ({ initialTerm, onSearch }: any) => {
	const [searchTerm, setSearchTerm] = useState(initialTerm || "");
	const router = useRouter();
	const { t } = useTranslation();

	const debouncedSearch = useCallback(
		(term: string) => {
			router.push(`/search?q=${encodeURIComponent(term)}`, undefined, {
				shallow: true,
			});
			onSearch(term);
		},
		[onSearch, router],
	);

	const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
		const term = e.target.value;
		setSearchTerm(term);
		debouncedSearchFunction(term, debouncedSearch);
	};

	const handleClear = () => {
		setSearchTerm("");
		debouncedSearch(""); // Trigger a search with an empty string
	};

	return (
		<TextField
			value={searchTerm}
			onChange={handleSearch}
			placeholder={t("general.search")}
			InputProps={{
				startAdornment: (
					<InputAdornment position="start">
						<SearchIcon />
					</InputAdornment>
				),
				endAdornment: searchTerm && (
					<InputAdornment position="end">
						<IconButton
							onClick={handleClear}
							edge="end"
							aria-label="clear search"
						>
							<Clear />
						</IconButton>
					</InputAdornment>
				),
			}}
			fullWidth
			variant="outlined"
			size="small"
		/>
	);
};

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
				// If no access token, no query OR no SEARCH_BASE env variable configured, we can't send a request.
				return;

			setLoading(true);
			const isUUID = query.length == 36 ? validate(query) : false;
			const requestURL = isUUID
				? `${publicRuntimeConfig.DCB_SEARCH_BASE}/public/opac-inventory/instances/${query}`
				: `${publicRuntimeConfig.DCB_SEARCH_BASE}/search/instances`;
			const queryParams = {
				query: `@keyword all "${query}"`,
				offset: page * pageSize,
				limit: pageSize,
			};

			try {
				const response = await axios.get(requestURL, {
					headers: { Authorization: `Bearer ${session.accessToken}` },
					params: isUUID ? {} : queryParams,
				});
				return response.data;
			} catch (error) {
				console.log(error);
				setError(true);
			} finally {
				setLoading(false);
			}
		},
		[session?.accessToken, publicRuntimeConfig.DCB_SEARCH_BASE],
	);

	const handleSearch = useCallback(
		async (query: string) => {
			const data = await fetchRecords(
				query,
				paginationModel.page,
				paginationModel.pageSize,
			);
			if (data) {
				if (data.instances) {
					setSearchResults({
						instances: data.instances || [],
						totalRecords: data.totalRecords || 1,
					});
				} else {
					if (data.totalRecords == 0) {
						setSearchResults({ instances: [], totalRecords: 0 });
					} else {
						setSearchResults({
							instances: [data],
							totalRecords: data.totalRecords || 1,
						});
					}
				}
			} else {
				setSearchResults({
					instances: [],
					totalRecords: 0,
				});
			}
		},
		[fetchRecords, paginationModel.page, paginationModel.pageSize],
	);

	useEffect(() => {
		const query = router.query.q as string;
		if (query) {
			handleSearch(query);
		}
	}, [router.query.q, handleSearch, paginationModel]);

	const rows = searchResults.instances || [];

	return publicRuntimeConfig.DCB_SEARCH_BASE ? (
		<AdminLayout title={t("nav.search.name")}>
			<SearchBar
				initialTerm={router.query.q as string}
				onSearch={handleSearch}
			/>
			{error ? (
				<>
					<Error
						title={t("ui.error.search_failed")}
						message={t("ui.info.connection_issue")}
						description={t("ui.info.reload")}
						action={t("ui.action.reload")}
						reload
					/>
				</>
			) : (
				<>
					<DataGridPremium
						rows={rows}
						columns={columns}
						pagination
						paginationModel={paginationModel}
						onPaginationModelChange={setPaginationModel}
						pageSizeOptions={[10, 25, 50, 100, 200]}
						rowCount={searchResults.totalRecords}
						paginationMode="server"
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
				</>
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
// If we ever wanted to go in an infinite scroll direction for this:
// You'd also need to introduce 'onRowScrollEnd' and be v.careful about sending too many requests.

// const loadMore = useCallback(async () => {
// 	if (!hasMore || loading) return;

// 	const query = router.query.q as string;
// 	const data = await fetchRecords(query, searchResults.instances.length, 25);
// 	if (data) {
// 		setSearchResults((prev: { instances: any }) => ({
// 			instances: [...prev.instances, ...data.instances],
// 			totalRecords: data.totalRecords,
// 		}));
// 		setHasMore(
// 			searchResults.instances.length + data.instances.length <
// 				data.totalRecords,
// 		);
// 	}
// }, [
// 	router.query.q,
// 	searchResults.instances.length,
// 	fetchRecords,
// 	hasMore,
// 	loading,
// ]);

/* {hasMore && !loading && <button onClick={loadMore}>Load More</button>}
					{loading && <div>Loading...</div>} */
// const [hasMore, setHasMore] = useState(true);
// in handleSearch
//				setHasMore(
// 	data.instances ? data.instances.length < data.totalRecords : false,
// );
