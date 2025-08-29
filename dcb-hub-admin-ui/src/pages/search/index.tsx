import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import { AdminLayout } from "@layout";
import { GetServerSideProps, NextPage } from "next";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import axios from "axios";
import { useSession } from "next-auth/react";
import Link from "@components/Link/Link";
import Error from "@components/Error/Error";
import {
	DataGridPremium,
	GridColDef,
	GridFilterModel,
	GridPaginationModel,
} from "@mui/x-data-grid-premium";
import { CustomNoDataOverlay } from "@components/ServerPaginatedGrid/components/DynamicOverlays";
import getConfig from "next/config";
import { validate } from "uuid";
import { SearchCriterion } from "@models/SearchCriterion";
import { SearchQueryBuilder } from "@components/SearchQueryBuilder/SearchQueryBuilder";
import { useSearchStore } from "@hooks/useSearchStore";
import { isEqual } from "lodash";
import {
	buildQueryFromCriteria,
	mapCriteriaToFilterModel,
	mapFilterModelToCriteria,
	parseQueryToCriteria,
} from "src/helpers/search/searchQueryHelpers";

interface SearchInstance {
	id: string;
	title: string;
	[key: string]: any;
}

interface SearchResultsState {
	instances: SearchInstance[];
	totalRecords: number;
}

// When we migrate to vite, we'll be able to take the implementation from DCB Admin for Libraries with consortia-specific adjustment.
// Until then, it's this one.
const Search: NextPage = () => {
	const router = useRouter();
	const { t } = useTranslation();
	const { data: session } = useSession();
	const { publicRuntimeConfig } = getConfig();

	// Get the global state
	const { criteria, setCriteria } = useSearchStore();

	// Local state for UI and data
	const [searchResults, setSearchResults] = useState<SearchResultsState>({
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
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(false);

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

	const fetchRecords = useCallback(
		async (query: string, page: number, pageSize: number) => {
			if (
				!session?.accessToken ||
				!query ||
				!publicRuntimeConfig.DCB_SEARCH_BASE
			)
				return;

			setLoading(true);
			setError(false);
			const isUUID = query.length === 36 ? validate(query) : false;
			const requestURL = isUUID
				? `${publicRuntimeConfig.DCB_SEARCH_BASE}/public/opac-inventory/instances/${query}`
				: `${publicRuntimeConfig.DCB_SEARCH_BASE}/search/instances`;

			const queryParams = {
				query: query,
				offset: page * pageSize,
				limit: pageSize,
			};

			try {
				const response = await axios.get(requestURL, {
					headers: { Authorization: `Bearer ${session.accessToken}` },
					params: isUUID ? {} : queryParams,
				});

				if (isUUID && response.data) {
					setSearchResults({ instances: [response.data], totalRecords: 1 });
				} else if (response.data.instances) {
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

	const executeSearch = (newCriteria: SearchCriterion[]) => {
		const newQuery = buildQueryFromCriteria(newCriteria);
		const currentQuery = router.query.q || "";

		if (newQuery !== currentQuery) {
			router.push(`/search?q=${encodeURIComponent(newQuery)}`, undefined, {
				shallow: true,
			});
		}
	};

	const handleBuilderSearch = () => {
		executeSearch(criteria);
	};

	const handleFilterModelChange = (newFilterModel: GridFilterModel) => {
		const currentCriteriaFromGrid = mapFilterModelToCriteria(filterModel);
		const newCriteriaFromGrid = mapFilterModelToCriteria(newFilterModel);
		if (!isEqual(currentCriteriaFromGrid, newCriteriaFromGrid)) {
			const newCriteria = mapFilterModelToCriteria(newFilterModel);
			setCriteria(newCriteria);
			executeSearch(newCriteria);
		}
		setFilterModel(newFilterModel);
	};

	// --- Effects ---

	// EFFECT 1: Sync URL to State and Fetch Data (The main driver)
	useEffect(() => {
		if (!router.isReady) return;

		const queryFromUrl = (router.query.q as string) || "";
		const parsedCriteria = parseQueryToCriteria(queryFromUrl);

		if (!isEqual(parsedCriteria, criteria)) {
			setCriteria(parsedCriteria);
		}

		if (queryFromUrl) {
			fetchRecords(
				queryFromUrl,
				paginationModel.page,
				paginationModel.pageSize,
			);
		} else {
			setLoading(false);
			setSearchResults({ instances: [], totalRecords: 0 });
		}
	}, [router.isReady, router.query.q, paginationModel, fetchRecords]);

	// EFFECT 2: Sync Zustand store state to the DataGrid's filterModel UI
	useEffect(() => {
		const newFilterModel = mapCriteriaToFilterModel(criteria);
		if (!isEqual(newFilterModel, filterModel)) {
			setFilterModel(newFilterModel);
		}
	}, [criteria]);

	const rows = searchResults.instances || [];

	return publicRuntimeConfig.DCB_SEARCH_BASE ? (
		<AdminLayout title={t("nav.search.name")}>
			<SearchQueryBuilder onSearch={handleBuilderSearch} />
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
					onFilterModelChange={handleFilterModelChange}
					pageSizeOptions={[10, 25, 50, 100, 200]}
					rowCount={searchResults.totalRecords}
					loading={loading}
					autoHeight
					getRowId={(row) => row?.id}
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
