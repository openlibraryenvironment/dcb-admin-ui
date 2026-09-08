import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "react-oidc-context";
import { Grid, Typography, useTheme } from "@mui/material";
import { Delete } from "@mui/icons-material";

import PageContainer from "@layout/PageContainer/PageContainer";
import LibraryTabs from "@components/LibraryTabs/LibraryTabs";
import MappingsSubTabs from "@components/MappingsSubTabs/MappingsSubTabs";
import EntityMutationDialogs from "@components/EntityMutationDialogs/EntityMutationDialogs";
import Loading from "@components/Loading/Loading";
import ErrorComponent from "@components/Error/Error";
import MappingsGrid from "@components/MappingsGrid/MappingsGrid";

import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { useEntityMutation } from "@hooks/useEntityMutation";

import { libraryQuery } from "@/queryOptions/library";
import { getNumericRangeMappings } from "@queries/getNumericRangeMappings";
import { numericRangeMappingColumnsNoCategoryFilter } from "@columns/numericRangeMappingColumnsNoCategoryFilter";

export const Route = createFileRoute(
	"/__authenticated/libraries/$libraryId/numericRangeMappings/all",
)({
	component: AllNumericMappings,
});

function AllNumericMappings() {
	const { t } = useTranslation();
	const { libraryId } = Route.useParams();
	const theme = useTheme();
	const gqlClient = useGraphQLClient();
	const auth = useAuth();

	const userRoles = (auth?.user?.profile?.roles as string[]) || [];
	const isAnAdmin =
		userRoles.includes("ADMIN") || userRoles.includes("CONSORTIUM_ADMIN");

	const libraryMutation = useEntityMutation("library");

	const {
		data: library,
		isLoading,
		error,
	} = useQuery(libraryQuery(gqlClient, libraryId));

	if (isLoading)
		return (
			<Loading
				title={t("ui.info.loading.document", {
					document_type: t("libraries.library"),
				})}
				subtitle={t("ui.info.wait")}
			/>
		);
	if (error || !library)
		return (
			<ErrorComponent
				title={t("ui.error.cannot_retrieve_record")}
				action={t("ui.actions.go_back")}
				goBack="/libraries"
				message={t("ui.error.invalid_UUID")}
			/>
		);

	const numericRangeAll = `context:"${library.agency?.hostLms?.code}" AND NOT deleted:true`;
	const numericRangeAllSecond = `context:"${library.secondHostLms?.code}" AND NOT deleted:true`;

	return (
		<PageContainer
			title={library.fullName}
			pageActions={[
				libraryMutation.buildDeleteAction({
					id: libraryId,
					name: library?.fullName,
					redirect: "/libraries",
					disabled: !isAnAdmin,
					icon: <Delete htmlColor={theme.palette.primary.exclamationIcon} />,
				}),
			]}
		>
			<Grid
				container
				spacing={{ xs: 2, md: 3 }}
				columns={{ xs: 3, sm: 6, md: 9, lg: 12 }}
			>
				<Grid size={{ xs: 4, sm: 8, md: 12 }}>
					<LibraryTabs libraryId={libraryId} value={3} />
				</Grid>

				<Grid size={{ xs: 4, sm: 8, md: 12 }}>
					<MappingsSubTabs
						libraryId={libraryId}
						type="numericRange"
						activeCategory="all"
					/>

					<Typography
						variant="h3"
						sx={{
							fontWeight: "bold",
							mb: 2,
						}}
					>
						{t("libraries.config.data.mappings.all_num_range", {
							hostLms: library.agency?.hostLms?.code,
						})}
					</Typography>

					{/* UNIFIED COMPONENT */}
					<MappingsGrid
						gridId={`numMappingsAllPrimary-${libraryId}`}
						hostLmsCode={library.agency?.hostLms?.code}
						baseQuery={numericRangeAll}
						isAnAdmin={isAnAdmin}
						columns={numericRangeMappingColumnsNoCategoryFilter}
						getQuery={getNumericRangeMappings}
						dataKey="numericRangeMappings"
						hiddenColumns={{ domain: false, lastImported: false }}
					/>

					{library.secondHostLms && (
						<>
							<Typography
								variant="h3"
								sx={{
									fontWeight: "bold",
									mt: 4,
									mb: 2,
								}}
							>
								{t("libraries.config.data.mappings.all_num_range", {
									hostLms: library.secondHostLms.code,
								})}
							</Typography>
							<MappingsGrid
								gridId={`numMappingsAllSecondary-${libraryId}`}
								hostLmsCode={library.secondHostLms.code}
								baseQuery={numericRangeAllSecond}
								isAnAdmin={isAnAdmin}
								columns={numericRangeMappingColumnsNoCategoryFilter}
								getQuery={getNumericRangeMappings}
								dataKey="numericRangeMappings"
								hiddenColumns={{ domain: false, lastImported: false }}
							/>
						</>
					)}
				</Grid>
			</Grid>
			<EntityMutationDialogs {...libraryMutation.dialogProps} />
		</PageContainer>
	);
}
