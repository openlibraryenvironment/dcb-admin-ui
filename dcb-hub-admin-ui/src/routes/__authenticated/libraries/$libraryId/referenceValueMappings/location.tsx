import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useAuth } from "react-oidc-context";
import { Grid, Typography, Button, useTheme } from "@mui/material";
import { Delete } from "@mui/icons-material";

import PageContainer from "@layout/PageContainer/PageContainer";
import LibraryTabs from "@components/LibraryTabs/LibraryTabs";
import MappingsSubTabs from "@components/MappingsSubTabs/MappingsSubTabs";
import Confirmation from "@components/Confirmation/Confirmation";
import TimedAlert from "@components/TimedAlert/TimedAlert";
import Loading from "@components/Loading/Loading";
import Error from "@components/Error/Error";
import NewMapping from "@forms/NewMapping/NewMapping";

import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { handleDeleteEntity } from "@helpers/actions/editAndDeleteActions";

import { getLibrary } from "@queries/getLibrary";
import { deleteLibraryMutation } from "@mutations/deleteLibrary";

import MappingsGrid from "@components/MappingsGrid/MappingsGrid";
import { updateReferenceValueMapping } from "@mutations/updateReferenceValueMapping";
import { deleteReferenceValueMapping } from "@mutations/deleteReferenceValueMapping";
import { getMappings } from "@queries/getMappings";
import { referenceValueMappingColumnsNoCategoryFilter } from "@columns/referenceValueMappingsNoCategoryFilter";
import type {
	DeleteLibraryMutationVariables,
	LoadLibraryQueryVariables,
} from "@generated/graphql";

export const Route = createFileRoute(
	"/__authenticated/libraries/$libraryId/referenceValueMappings/location",
)({
	component: LocationMappings,
});

function LocationMappings() {
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
	const [newMapping, setNewMapping] = useState({
		show: false,
		hostLmsCode: "",
		agencyCode: "",
		libraryName: "",
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
			gqlClient.request<any, DeleteLibraryMutationVariables>(
				deleteLibraryMutation,
				variables,
			),
	});

	const library = libraryData?.libraries?.content?.[0];
	const locationPrimaryQuery = `(toContext:"${library.agency?.hostLms?.code}" OR fromContext:"${library.agency?.hostLms?.code}") AND (toCategory:"Location" OR fromCategory:"Location") AND NOT deleted:true`;
	const locationSecondaryQuery = `(toContext:"${library.secondHostLms?.code}" OR fromContext:"${library.secondHostLms?.code}") AND (toCategory:"Location" OR fromCategory:"Location") AND NOT deleted:true`;
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
			<Error
				title={t("ui.error.cannot_retrieve_record")}
				action={t("ui.actions.go_back")}
				goBack="/libraries"
				message={t("ui.error.invalid_UUID")}
			/>
		);

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
						type="referenceValue"
						activeCategory="location"
					/>

					{/* Primary Host LMS Grid */}
					<Typography
						variant="h3"
						sx={{
							fontWeight: "bold",
						}}
					>
						{t("libraries.config.data.mappings.location", {
							hostLms: library.agency?.hostLms?.code,
						})}
					</Typography>
					{isAnAdmin && (
						<Button
							variant="outlined"
							sx={{ mt: 1, mb: 2 }}
							onClick={() =>
								setNewMapping({
									show: true,
									hostLmsCode: library.agency?.hostLms?.code,
									agencyCode: library.agencyCode,
									libraryName: library.fullName,
								})
							}
						>
							{t("mappings.new.title")}
						</Button>
					)}
					<MappingsGrid
						gridId={`refMappingsLocationPrimary-${libraryId}`}
						hostLmsCode={library.agency?.hostLms?.code}
						baseQuery={locationPrimaryQuery}
						isAnAdmin={isAnAdmin}
						columns={referenceValueMappingColumnsNoCategoryFilter}
						getQuery={getMappings}
						updateMutation={updateReferenceValueMapping}
						deleteMutation={deleteReferenceValueMapping}
						dataKey="referenceValueMappings"
						mutationUpdateKey="updateReferenceValueMapping"
						hiddenColumns={{
							fromCategory: false,
							lastImported: false,
							toCategory: false,
						}}
					/>
					{/* Secondary Host LMS Grid (If exists) */}
					{library.secondHostLms && (
						<>
							<Typography
								variant="h3"
								sx={{
									fontWeight: "bold",
									mt: 4,
								}}
							>
								{t("libraries.config.data.mappings.location", {
									hostLms: library.secondHostLms.code,
								})}
							</Typography>
							{isAnAdmin && (
								<Button
									variant="outlined"
									sx={{ mt: 1, mb: 2 }}
									onClick={() =>
										setNewMapping({
											show: true,
											hostLmsCode: library.secondHostLms.code,
											agencyCode: library.agencyCode,
											libraryName: library.fullName,
										})
									}
								>
									{t("mappings.new.title")}
								</Button>
							)}
							<MappingsGrid
								gridId={`refMappingsLocationSecondary-${libraryId}`}
								hostLmsCode={library.secondHostLms.code}
								baseQuery={locationSecondaryQuery}
								isAnAdmin={isAnAdmin}
								columns={referenceValueMappingColumnsNoCategoryFilter}
								getQuery={getMappings}
								updateMutation={updateReferenceValueMapping}
								deleteMutation={deleteReferenceValueMapping}
								dataKey="referenceValueMappings"
								mutationUpdateKey="updateReferenceValueMapping"
								hiddenColumns={{
									fromCategory: false,
									lastImported: false,
									toCategory: false,
								}}
							/>
						</>
					)}
				</Grid>
			</Grid>
			{newMapping.show && (
				<NewMapping
					show={newMapping.show}
					onClose={() =>
						setNewMapping({
							show: false,
							hostLmsCode: "",
							agencyCode: "",
							libraryName: "",
						})
					}
					category="Location"
					hostLmsCode={newMapping.hostLmsCode}
					agencyCode={newMapping.agencyCode}
					libraryName={newMapping.libraryName}
				/>
			)}
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
