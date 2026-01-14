import { useEffect, useMemo, useState } from "react";
import { GridColDef } from "@mui/x-data-grid-pro";
import { GetServerSideProps, NextPage } from "next";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import { useQuery } from "@apollo/client";
import { getClusters } from "src/queries/queries";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { AdminLayout } from "@layout";
import Error from "@components/Error/Error";
import { ClientDataGrid } from "@components/ClientDataGrid";
import Alert from "@components/Alert/Alert";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import { handleRecordTabChange } from "src/helpers/navigation/handleTabChange";
import { Tab, Tabs } from "@mui/material";

interface Identifier {
	namespace: string;
	value: string;
}

interface Member {
	id: string;
	title: string;
	author: string | null;
	sourceRecordId: string;
	sourceSystemId: string;
	canonicalMetadata?: {
		identifiers?: Identifier[];
	};
}

interface RowData extends Record<string, string> {
	id: string;
	title: string;
	author: string;
	sourceRecordId: string;
	sourceSystemId: string;
}

const Identifiers: NextPage = () => {
	const { t } = useTranslation();
	const router = useRouter();
	const { id } = router.query;
	const [sourceRecordErrorAlertDisplayed, setSourceRecordErrorAlertDisplayed] =
		useState(false);
	const [tabIndex, setTabIndex] = useState(2);

	const { loading, error, data } = useQuery(getClusters, {
		variables: { query: `id: ${id}` },
		skip: !id,
		errorPolicy: "all",
	});
	useEffect(() => {
		if (error?.message?.includes("Source emitted")) {
			setSourceRecordErrorAlertDisplayed(true);
		}
	}, [error]);

	const sourceRecordError = error?.message?.includes("Source emitted");
	const standardError = error && !sourceRecordError;

	const theCluster = data?.instanceClusters?.content?.[0] ?? null;

	const { rows, namespaces } = useMemo(() => {
		if (!theCluster) return { rows: [], namespaces: new Set<string>() };

		const namespaces = new Set<string>();
		const rows: RowData[] = theCluster.members.map(
			(member: Member, index: any) => {
				const baseRow: RowData = {
					id: `${member.id}-${index}`,
					title: member.title || "",
					author: member.author || "",
					sourceRecordId: member.sourceRecordId || "",
					sourceSystemId: member.sourceSystemId || "",
				};
				const identifiers = member.canonicalMetadata?.identifiers || [];
				// Group identifiers by namespace
				const groupedIdentifiers = identifiers.reduce(
					(acc: Record<string, string[]>, identifier: any) => {
						if (!acc[identifier.namespace]) {
							acc[identifier.namespace] = [];
						}
						acc[identifier.namespace].push(identifier.value);
						return acc;
					},
					{},
				);
				// Add namespaces and join multiple values with line breaks
				Object.entries(groupedIdentifiers).forEach(([namespace, values]) => {
					namespaces.add(namespace);
					baseRow[namespace] = values.join("\n");
				});

				return baseRow;
			},
		);

		return { rows, namespaces };
	}, [theCluster]);

	const columns: GridColDef[] = useMemo(() => {
		const baseColumns: GridColDef[] = [
			{ field: "title", headerName: "Title", flex: 0.5, minWidth: 150 },
			{ field: "author", headerName: "Author", flex: 0.5, minWidth: 150 },
		];

		const namespaceColumns: GridColDef[] = Array.from(namespaces).map(
			(namespace) => ({
				field: namespace,
				headerName: namespace,
				flex: 1,
				minWidth: 150,
				type: "string",
			}),
		);

		return [...baseColumns, ...namespaceColumns];
	}, [namespaces]);

	return standardError ? (
		<AdminLayout hideBreadcrumbs>
			{standardError ? (
				<Error
					title={t("ui.error.cannot_retrieve_record")}
					message={t("ui.info.connection_issue")}
					description={t("ui.info.try_later")}
					action={t("ui.action.go_back")}
					goBack="/search"
				/>
			) : (
				<Error
					title={t("ui.error.cannot_find_record")}
					message={t("ui.error.invalid_UUID")}
					description={t("ui.info.check_address")}
					action={t("ui.action.go_back")}
					goBack="/search"
				/>
			)}
		</AdminLayout>
	) : (
		<AdminLayout title="Identifiers">
			<Grid
				container
				spacing={{ xs: 2, md: 3 }}
				columns={{ xs: 3, sm: 6, md: 9, lg: 12 }}
			>
				<Grid size={{ xs: 4, sm: 8, md: 12 }}>
					<Tabs
						value={tabIndex}
						onChange={(event, value) => {
							handleRecordTabChange(
								event,
								value,
								router,
								setTabIndex,
								id as string,
							);
						}}
						aria-label="Group navigation"
					>
						<Tab label={t("nav.search.cluster")} />
						<Tab label={t("nav.search.items")} />
						<Tab label={t("nav.search.identifiers")} />
						<Tab label={t("nav.search.requesting_history")} />
					</Tabs>
				</Grid>
				{sourceRecordErrorAlertDisplayed ? (
					<Alert
						severityType="info"
						onCloseFunc={() => setSourceRecordErrorAlertDisplayed(false)}
						alertText={
							<Typography variant="attributeText">
								{t("search.cluster_bib_multiple_records")}
							</Typography>
						}
					/>
				) : null}
				<Grid size={{ xs: 4, sm: 8, md: 12 }}>
					<ClientDataGrid
						data={rows}
						autoRowHeight={true}
						columns={columns}
						loading={loading}
						type="Identifiers"
						coreType="ClusterRecord"
						operationDataType="identifiers"
						selectable={false}
						disableAggregation={true}
						disableRowGrouping={true}
					/>
				</Grid>
			</Grid>
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

export default Identifiers;
