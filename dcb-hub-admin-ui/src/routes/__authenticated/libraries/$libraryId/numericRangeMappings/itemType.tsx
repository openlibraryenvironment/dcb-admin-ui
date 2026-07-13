import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useAuth } from "react-oidc-context";
import { Grid, Typography, useTheme } from "@mui/material";
import { Delete } from "@mui/icons-material";

import PageContainer from "@layout/PageContainer/PageContainer";
import LibraryTabs from "@components/LibraryTabs/LibraryTabs";
import MappingsSubTabs from "@components/MappingsSubTabs/MappingsSubTabs";
import Confirmation from "@components/Confirmation/Confirmation";
import TimedAlert from "@components/TimedAlert/TimedAlert";
import Loading from "@components/Loading/Loading";
import ErrorComponent from "@components/Error/Error";
import MappingsGrid from "@components/MappingsGrid/MappingsGrid";

import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { handleDeleteEntity } from "@helpers/actions/editAndDeleteActions";

import { getLibrary } from "@queries/getLibrary";
import { deleteLibraryMutation } from "@mutations/deleteLibrary";
import { getNumericRangeMappings } from "@queries/getNumericRangeMappings";
import { updateNumericRangeMapping } from "@mutations/updateNumericRangeMapping";
import { deleteNumericRangeMapping } from "@mutations/deleteNumericRangeMapping";
import { numericRangeMappingColumnsNoCategoryFilter } from "@columns/numericRangeMappingColumnsNoCategoryFilter";
import type { LoadLibraryQueryVariables } from "@generated/graphql";

export const Route = createFileRoute(
	"/__authenticated/libraries/$libraryId/numericRangeMappings/itemType",
)({
	component: AllNumericMappings,
});

function AllNumericMappings() {
	const { t } = useTranslation();
	const router = useRouter();
	const { libraryId } = Route.useParams();
	const theme = useTheme();
	const gqlClient = useGraphQLClient();
	const auth = useAuth();

	const userRoles = (auth?.user?.profile?.roles as string[]) || [];
	const isAnAdmin =
		userRoles.includes("ADMIN") || userRoles.includes("CONSORTIUM_ADMIN");

	const [showConfirmationDeletion, setConfirmationDeletion] = useState(false);
	const [alert, setAlert] = useState({
		open: false,
		severity: "success",
		text: "",
		title: "",
	});

	const {
		data: libraryData,
		isLoading,
		error,
	} = useQuery({
		queryKey: ["library", libraryId],
		queryFn: () =>
			gqlClient.request<any, LoadLibraryQueryVariables>(getLibrary, {
				query: `id:${libraryId}`,
			}),
		enabled: !!libraryId,
	});

	const { mutateAsync: deleteLibrary } = useMutation({
		mutationFn: (variables: { input: any }) =>
			gqlClient.request(deleteLibraryMutation, variables),
	});

	const library = libraryData?.libraries?.content?.[0];

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

	const numericRangeItemTypePrimary = `context:"${library.agency?.hostLms?.code}" AND domain:"ItemType" AND NOT deleted:true`;
	const numericRangeItemTypeSecondary = `context:"${library.secondHostLms?.code}" AND domain:"ItemType" AND NOT deleted:true`;

	return (
		<PageContainer
			title={library.fullName}
			pageActions={[
				{
					key: "delete",
					onClick: () => setConfirmationDeletion(true),
					disabled: !isAnAdmin,
					label: t("ui.data_grid.delete_entity", {
						entity: t("libraries.library").toLowerCase(),
					}),
					startIcon: (
						<Delete htmlColor={theme.palette.primary.exclamationIcon} />
					),
				},
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
						activeCategory="itemType"
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
						gridId="numMappingsAllPrimary"
						hostLmsCode={library.agency?.hostLms?.code}
						baseQuery={numericRangeItemTypePrimary}
						isAnAdmin={isAnAdmin}
						columns={numericRangeMappingColumnsNoCategoryFilter}
						getQuery={getNumericRangeMappings}
						updateMutation={updateNumericRangeMapping}
						deleteMutation={deleteNumericRangeMapping}
						dataKey="numericRangeMappings"
						mutationUpdateKey="updateNumericRangeMapping"
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
								gridId="numMappingsAllSecondary"
								hostLmsCode={library.secondHostLms.code}
								baseQuery={numericRangeItemTypeSecondary}
								isAnAdmin={isAnAdmin}
								columns={numericRangeMappingColumnsNoCategoryFilter}
								getQuery={getNumericRangeMappings}
								updateMutation={updateNumericRangeMapping}
								deleteMutation={deleteNumericRangeMapping}
								dataKey="numericRangeMappings"
								mutationUpdateKey="updateNumericRangeMapping"
								hiddenColumns={{ domain: false, lastImported: false }}
							/>
						</>
					)}
				</Grid>
			</Grid>
			<Confirmation
				open={showConfirmationDeletion}
				onClose={() => setConfirmationDeletion(false)}
				onConfirm={(r, c, u) => {
					handleDeleteEntity(
						library.id,
						r,
						c,
						u,
						setAlert,
						deleteLibrary,
						t,
						router,
						library.fullName,
						"deleteLibrary",
						"/libraries",
					);
					setConfirmationDeletion(false);
				}}
				action="deletion"
				entityName={library.fullName}
			/>
			<TimedAlert
				open={alert.open}
				severityType={alert.severity}
				alertText={alert.text}
				alertTitle={alert.title}
				onCloseFunc={() => setAlert({ ...alert, open: false })}
			/>
		</PageContainer>
	);
}
