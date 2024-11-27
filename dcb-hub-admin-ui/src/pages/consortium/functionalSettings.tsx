import { useApolloClient, useMutation, useQuery } from "@apollo/client";
import TimedAlert from "@components/TimedAlert/TimedAlert";
import Confirmation from "@components/Upload/Confirmation/Confirmation";
import { useConsortiumInfoStore } from "@hooks/consortiumInfoStore";
import { AdminLayout } from "@layout";
import { FunctionalSetting } from "@models/FunctionalSetting";
import { Button, Stack, Tab, Tabs, Typography } from "@mui/material";
import Grid from "@mui/material/Unstable_Grid2";
import { GetServerSideProps, GetServerSidePropsContext, NextPage } from "next";
import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useRouter } from "next/router";
import { useState } from "react";
import { adminOnly } from "src/constants/roles";
import RenderAttribute from "src/helpers/RenderAttribute/RenderAttribute";
import {
	getConsortiaFunctionalSettings,
	updateFunctionalSettingQuery,
} from "src/queries/queries";

const FunctionalSettings: NextPage = () => {
	const { t } = useTranslation();
	const [tabIndex, setTabIndex] = useState(1);
	const router = useRouter();
	const client = useApolloClient();
	const { displayName } = useConsortiumInfoStore();
	const { data: session } = useSession();

	const [alert, setAlert] = useState<any>({
		open: false,
		severity: "success",
		text: null,
		title: null,
		type: "",
	});

	const isAdminOnly = session?.profile?.roles?.some(
		(role: string) => role == adminOnly,
	);

	const getAlertText = (
		functionalSetting: FunctionalSetting,
		success: boolean,
	) => {
		switch (success) {
			case true:
				console.log(functionalSetting);
				if (functionalSetting?.enabled) {
					return t("consortium.settings.enable_success", {
						setting: functionalSetting.name,
						consortium: displayName,
					});
				} else {
					return t("consortium.settings.disable_success", {
						setting: functionalSetting.name,
						consortium: displayName,
					});
				}
			case false:
				if (functionalSetting.enabled) {
					return t("consortium.settings.enable_error", {
						setting: functionalSetting.name,
						consortium: displayName,
					});
				} else {
					return t("consortium.settings.disable_error", {
						setting: functionalSetting.name,
						consortium: displayName,
					});
				}
		}
	};
	const [confirmation, setConfirmation] = useState<any>({
		open: false,
		headerText: "",
		buttonText: "",
		bodyText: "",
		type: "functionalSettings",
		entity: t("consortium.settings.one"),
		activeSetting: null,
	});
	const { data } = useQuery(getConsortiaFunctionalSettings, {
		variables: {
			order: "id",
			orderBy: "DESC",
			pageno: 0,
			pagesize: 10,
		},
	});
	const [updateFunctionalSetting] = useMutation(updateFunctionalSettingQuery);

	const consortiumFunctionalSettings: FunctionalSetting[] =
		data?.consortia?.content[0]?.functionalSettings;

	const pickupAnywhere = consortiumFunctionalSettings?.find(
		(fs) => fs.name == "PICKUP_ANYWHERE",
	);
	const reResolution = consortiumFunctionalSettings?.find(
		(fs) => fs.name == "RE_RESOLUTION",
	);

	const selectUnavailable = consortiumFunctionalSettings?.find(
		(fs) => fs.name == "SELECT_UNAVAILABLE_ITEMS",
	);
	const closeConfirmation = () => {
		setConfirmation({
			open: false,
			headerText: "",
			buttonText: "",
			bodyText: "",
			type: "",
			entity: "",
		});
		// This ensures we're up-to-date after confirmation closes
		client.refetchQueries({
			include: ["LoadConsortiumFS"],
		});
	};

	const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
		setTabIndex(newValue);
		switch (newValue) {
			case 0:
				router.push("/consortium");
				break;
			case 1:
				router.push("/consortium/functionalSettings");
				break;
			case 2:
				router.push("/consortium/onboarding");
				break;
			case 3:
				router.push("/consortium/contacts");
				break;
		}
	};
	// Probably need to pass individual functional settings in here to genericise
	const handleFunctionalSettingConfirmation = (
		reason: string,
		changeCategory: string,
		changeReferenceUrl: string,
		functionalSetting: FunctionalSetting,
	) => {
		const input = {
			id: functionalSetting?.id,
			enabled: !functionalSetting?.enabled ? true : false, // if false already, change to true
			reason: reason,
			changeCategory: changeCategory,
			changeReferenceUrl: changeReferenceUrl,
		};
		updateFunctionalSetting({
			variables: {
				input,
			},
		})
			.then((response) => {
				if (response.data) {
					console.log(response.data);
					const updatedFunctionalSetting: FunctionalSetting =
						response.data.updateFunctionalSetting;
					setAlert({
						open: true,
						severity: "success",
						text: getAlertText(updatedFunctionalSetting, true),
						title: t("ui.data_grid.updated"),
					});
					closeConfirmation();
				} else {
					setAlert({
						open: true,
						severity: "error",
						text: getAlertText(functionalSetting, false),
						title: t("ui.data_grid.error"),
					});
					closeConfirmation();
				}
			})
			.catch((error) => {
				console.error(error);
				setAlert({
					open: true,
					severity: "error",
					text: getAlertText(functionalSetting, false),
					title: t("ui.data_grid.error"),
				});
				closeConfirmation();
			});
	};

	const openConfirmation = (
		functionalSettingName: string,
		enabled: boolean,
	) => {
		switch (functionalSettingName) {
			case "pickupAnywhere":
				if (!enabled) {
					setConfirmation({
						open: true,
						headerText: t("consortium.settings.enable", {
							setting: t("consortium.settings.pickup_anywhere"),
						}),
						buttonText: t("consortium.settings.enable", {
							setting: t("consortium.settings.pickup_anywhere"),
						}),
						bodyText: t("consortium.settings.enable_body", {
							setting: t("consortium.settings.pickup_anywhere"),
							consortium: displayName,
						}),
						activeSetting: pickupAnywhere,
					});
				} else {
					setConfirmation({
						open: true,
						headerText: t("consortium.settings.disable", {
							setting: t("consortium.settings.pickup_anywhere"),
						}),
						buttonText: t("consortium.settings.disable", {
							setting: t("consortium.settings.pickup_anywhere"),
						}),
						bodyText: t("consortium.settings.disable_body", {
							setting: t("consortium.settings.pickup_anywhere"),
							consortium: displayName,
						}),
						activeSetting: pickupAnywhere,
					});
				}
				break;
			case "reResolution":
				if (!enabled) {
					setConfirmation({
						open: true,
						headerText: t("consortium.settings.enable", {
							setting: t("consortium.settings.re_resolution"),
						}),
						buttonText: t("consortium.settings.enable", {
							setting: t("consortium.settings.re_resolution"),
						}),
						bodyText: t("consortium.settings.enable_body", {
							setting: t("consortium.settings.re_resolution"),
							consortium: displayName,
						}),
						activeSetting: reResolution,
					});
				} else {
					setConfirmation({
						open: true,
						headerText: t("consortium.settings.disable", {
							setting: t("consortium.settings.re_resolution"),
						}),
						buttonText: t("consortium.settings.disable", {
							setting: t("consortium.settings.re_resolution"),
						}),
						bodyText: t("consortium.settings.disable_body", {
							setting: t("consortium.settings.re_resolution"),
							consortium: displayName,
						}),
						activeSetting: reResolution,
					});
				}
				break;
			case "selectUnavailable":
				if (!enabled) {
					setConfirmation({
						open: true,
						headerText: t("consortium.settings.enable", {
							setting: t("consortium.settings.select_unavailable"),
						}),
						buttonText: t("consortium.settings.enable", {
							setting: t("consortium.settings.select_unavailable"),
						}),
						bodyText: t("consortium.settings.enable_body", {
							setting: t("consortium.settings.select_unavailable"),
							consortium: displayName,
						}),
						activeSetting: selectUnavailable,
					});
				} else {
					setConfirmation({
						open: true,
						headerText: t("consortium.settings.disable", {
							setting: t("consortium.settings.select_unavailable"),
						}),
						buttonText: t("consortium.settings.disable", {
							setting: t("consortium.settings.select_unavailable"),
						}),
						bodyText: t("consortium.settings.disable_body", {
							setting: t("consortium.settings.select_unavailable"),
							consortium: displayName,
						}),
						activeSetting: selectUnavailable,
					});
				}
				break;
		}
	};

	return (
		<AdminLayout title={t("nav.consortium.functionalSettings")}>
			<Grid
				container
				spacing={{ xs: 2, md: 3 }}
				columns={{ xs: 3, sm: 6, md: 9, lg: 12 }}
				sx={{ marginBottom: "5px" }}
			>
				<Grid xs={4} sm={8} md={12}>
					<Tabs
						value={tabIndex}
						onChange={handleTabChange}
						aria-label="Consortium Navigation"
					>
						<Tab label={t("nav.consortium.profile")} />
						<Tab label={t("nav.consortium.functionalSettings")} />
						<Tab label={t("nav.consortium.onboarding")} />
						<Tab label={t("nav.consortium.contacts")} />
					</Tabs>
				</Grid>
				<Grid xs={4} sm={8} md={12}>
					<Typography variant="attributeText">
						{t("consortium.settings.introduction")}
					</Typography>
				</Grid>
				{pickupAnywhere ? (
					<Grid xs={4} sm={8} md={12}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("consortium.settings.pickup_anywhere_enabled")}
							</Typography>
							<RenderAttribute attribute={pickupAnywhere?.enabled} />
						</Stack>
						<Button
							onClick={() =>
								openConfirmation("pickupAnywhere", !!pickupAnywhere?.enabled)
							}
							color="primary"
							variant="outlined"
							sx={{
								marginTop: 1,
							}}
							type="submit"
						>
							{pickupAnywhere?.enabled
								? t("consortium.settings.disable", {
										setting: t("consortium.settings.pickup_anywhere"),
									})
								: t("consortium.settings.enable", {
										setting: t("consortium.settings.pickup_anywhere"),
									})}
						</Button>
					</Grid>
				) : null}
				{reResolution ? (
					<Grid xs={4} sm={8} md={12}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("consortium.settings.re_resolution_enabled")}
							</Typography>
							<RenderAttribute attribute={reResolution?.enabled} />
						</Stack>
						<Button
							onClick={() =>
								openConfirmation("reResolution", !!reResolution?.enabled)
							}
							color="primary"
							variant="outlined"
							sx={{
								marginTop: 1,
							}}
							type="submit"
						>
							{reResolution?.enabled
								? t("consortium.settings.disable", {
										setting: t("consortium.settings.re_resolution"),
									})
								: t("consortium.settings.enable", {
										setting: t("consortium.settings.re_resolution"),
									})}
						</Button>
					</Grid>
				) : null}
				{selectUnavailable ? (
					<Grid xs={4} sm={8} md={12}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("consortium.settings.select_unavailable_enabled")}
							</Typography>
							<RenderAttribute attribute={selectUnavailable?.enabled} />
						</Stack>
						{isAdminOnly ? (
							<Button
								onClick={() =>
									openConfirmation(
										"selectUnavailable",
										!!selectUnavailable?.enabled,
									)
								}
								color="primary"
								variant="outlined"
								sx={{
									marginTop: 1,
								}}
								type="submit"
							>
								{selectUnavailable?.enabled
									? t("consortium.settings.disable", {
											setting: t("consortium.settings.select_unavailable"),
										})
									: t("consortium.settings.enable", {
											setting: t("consortium.settings.select_unavailable"),
										})}
							</Button>
						) : null}
					</Grid>
				) : null}
			</Grid>
			<Confirmation
				open={confirmation.open}
				onClose={() => closeConfirmation()}
				onConfirm={(reason, changeCategory, changeReferenceUrl) =>
					handleFunctionalSettingConfirmation(
						reason,
						changeCategory,
						changeReferenceUrl,
						confirmation.activeSetting,
					)
				}
				type={confirmation.type ?? "functionalSettings"}
				library={pickupAnywhere?.name}
				entity={confirmation.entity}
				headerText={confirmation.headerText}
				buttonText={confirmation.buttonText}
				bodyText={confirmation.bodyText}
			/>
			<TimedAlert
				open={alert.open}
				severityType={alert.severity}
				autoHideDuration={6000}
				alertText={alert.text}
				onCloseFunc={() => setAlert({ ...alert, open: false })}
				entity={t("functional_setting_one")}
				alertTitle={alert.title}
			/>
		</AdminLayout>
	);
};

export const getServerSideProps: GetServerSideProps = async (
	context: GetServerSidePropsContext,
) => {
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

export default FunctionalSettings;
