import { useApolloClient, useMutation, useQuery } from "@apollo/client";
import TimedAlert from "@components/TimedAlert/TimedAlert";
import Confirmation from "@components/Upload/Confirmation/Confirmation";
import { AdminLayout } from "@layout";
import { FunctionalSetting } from "@models/FunctionalSetting";
import { Button, Stack, Tab, Tabs, Typography } from "@mui/material";
import Grid from "@mui/material/Unstable_Grid2";
import { GetServerSideProps, GetServerSidePropsContext, NextPage } from "next";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useRouter } from "next/router";
import { useState } from "react";
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
	const [showConfirmation, setShowConfirmation] = useState(false);

	const [alert, setAlert] = useState<any>({
		open: false,
		severity: "success",
		text: null,
		title: null,
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
	const closeConfirmation = () => {
		setShowConfirmation(false);
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
		functionalSetting?: FunctionalSetting,
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
		}).then((response) => {
			if (response.data) {
				setAlert({
					open: true,
					severity: "success",
					text: "Successfully changed functional setting",
					title: t("ui.data_grid.updated"),
				});
				closeConfirmation();
			} else {
				setAlert({
					open: true,
					severity: "error",
					text: "Failed to change functional setting",
					title: t("ui.data_grid.error"),
				});
				closeConfirmation();
			}
		});
	};

	const openConfirmation = (functionalSettingName: string) => {
		if (functionalSettingName === "pickupAnywhere") {
			setShowConfirmation(true);
		} else {
			// Expand with other functional settings as they are devised.
			setShowConfirmation(true);
		}
	};

	return (
		<AdminLayout title={t("nav.consortium.name")}>
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
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">
							Pickup anywhere enabled?
						</Typography>
						<RenderAttribute attribute={pickupAnywhere?.enabled} />
						<Button
							onClick={() => openConfirmation("pickupAnywhere")}
							color="primary"
							variant="outlined"
							sx={{ marginTop: 1 }}
							type="submit"
						>
							{pickupAnywhere?.enabled
								? t("consortium.settings.disable_pickup_anywhere")
								: t(
										"libraries.circulation.confirmation.enable_pickup_anywhere",
									)}
						</Button>
					</Stack>
				</Grid>
			</Grid>
			<Confirmation
				open={showConfirmation}
				onClose={() => closeConfirmation()}
				onConfirm={(reason, changeCategory, changeReferenceUrl) =>
					handleFunctionalSettingConfirmation(
						reason,
						changeCategory,
						changeReferenceUrl,
						pickupAnywhere,
					)
				}
				type="updatePickupAnywhere"
				library={pickupAnywhere?.name}
				entity={t("nav.consortium")}
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
