import { AdminLayout } from "@layout";
import { GetServerSideProps, NextPage } from "next";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import axios from "axios";
import { useSession } from "next-auth/react";
import getConfig from "next/config";
import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import Link from "@components/Link/Link";
import SearchOnlyToolbar from "@components/ServerPaginatedGrid/components/SearchOnlyToolbar";
import Error from "@components/Error/Error";
import {
	DataGridPro,
	GridColDef,
	GridPaginationModel,
} from "@mui/x-data-grid-pro";
import { CustomNoDataOverlay } from "@components/ServerPaginatedGrid/components/DynamicOverlays";
// DCB Discovery page for searching records
// This doesn't use ServerPaginatedGrid as that's only for GraphQL
// Needs a custom 'first load' message and a custom error telling people to reload page

const Search: NextPage = () => {
	const { publicRuntimeConfig } = getConfig();
	const { data: session } = useSession();
	const { t } = useTranslation();
	const router = useRouter();
	const { query } = router;

	const [searchResults, setSearchResults] = useState<any>({
		instances: [],
		totalRecords: 0,
	});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(false);
	const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
		page: 0,
		pageSize: 25,
	});
	const [searchQuery, setSearchQuery] = useState((query.q as string) || "");

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
	];

	const fetchRecords = useCallback(
		async (query: string, page: number, pageSize: number) => {
			if (!query || !session?.accessToken) return;

			try {
				setLoading(true);
				const response = await axios.get(
					`${publicRuntimeConfig.DCB_SEARCH_BASE}/search/instances`,
					{
						headers: { Authorization: `Bearer ${session.accessToken}` },
						params: {
							query: `@keyword all "${query}"`,
							offset: page * pageSize,
							limit: pageSize,
						},
					},
				);
				setSearchResults({
					instances: response.data.instances,
					totalRecords: response.data.totalRecords,
				});
				setLoading(false);
			} catch (error) {
				setError(true);
				setLoading(false);
			}
		},
		[publicRuntimeConfig.DCB_SEARCH_BASE, session?.accessToken],
	);

	useEffect(() => {
		fetchRecords(searchQuery, paginationModel.page, paginationModel.pageSize);
	}, [fetchRecords, searchQuery, paginationModel]);

	useEffect(() => {
		if (query.q) {
			setSearchQuery(query.q as string);
		}
	}, [query.q]);

	const handleSearchChange = (value: string) => {
		setSearchQuery(value);
		router.push(`/search?q=${encodeURIComponent(value)}`, undefined, {
			shallow: true,
		});
	};

	// change action to be reload
	return (
		<AdminLayout title={t("nav.search.name")}>
			{error ? (
				<Error
					title={t("ui.error.search_failed")}
					message={t("ui.info.connection_issue")}
					description={t("ui.info.reload")}
					action={t("ui.action.go_back")}
					goBack="/search"
				/>
			) : (
				<DataGridPro
					rows={searchResults.instances ?? []}
					columns={columns}
					paginationModel={paginationModel}
					onPaginationModelChange={setPaginationModel}
					pageSizeOptions={[5, 10, 25, 50, 100, 200]}
					rowCount={searchResults.totalRecords}
					loading={loading}
					pagination
					paginationMode="server"
					autoHeight={true}
					slots={{
						toolbar: SearchOnlyToolbar,
						noRowsOverlay: () => (
							<CustomNoDataOverlay noDataMessage={t("search.no_data")} />
						),
					}}
					slotProps={{
						toolbar: {
							showQuickFilter: true,
							quickFilterProps: { debounceMs: 500 },
						},
					}}
					onFilterModelChange={(model) =>
						handleSearchChange(model.quickFilterValues?.[0] || "")
					}
				/>
			)}
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
