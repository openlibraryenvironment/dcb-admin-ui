// GO-LIVE TASK: The commented out sections of this file are to be restored before go-live.
// A default of 'true' has been set for the interim.

import type { NextPage } from "next";
import { AdminLayout } from "@layout";
import { Button, Stack, Typography } from "@mui/material";
// import { FormControlLabel, Stack, Switch, Typography } from "@mui/material";
import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next"; //localisation
import ConsortiumDetails from "@components/HomeContent/ConsortiumDetails";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import EnvironmentDetails from "@components/HomeContent/EnvironmentDetails";
import Loading from "@components/Loading/Loading";
import { useRouter } from "next/router";
// import { useState } from "react";
import { useEffect, useState } from "react";
import { useQuery } from "@apollo/client/react";
import { getConsortia } from "src/queries/queries";
import dayjs from "dayjs";
import OperatingWelcome from "@components/OperatingWelcome/OperatingWelcome";

const Home: NextPage = () => {
	const router = useRouter();
	const { data: session, status }: { data: any; status: any } = useSession({
		required: true,
		onUnauthenticated() {
			// Push to logout page if not authenticated.
			router.push("/auth/logout");
		},
	});

	// TO BE RESTORED BEFORE GO-LIVE
	const today = dayjs().startOf("day");
	const [operational, setOperational] = useState<null | boolean>(null);
	const { data, loading } = useQuery(getConsortia, {
		variables: { order: "name", orderBy: "ASC" },
		context: {
			headers: {
				authorization: `${session?.accessToken ? session.accessToken : ""}`,
			},
		},
	});

	// This will get the first consortia with a date of launch.
	// In prod we would expect only one consortia - in dev there may be multiple. This ensures this works regardless.
	// The effect is thus to avoid flickering between operational / onboarding
	useEffect(() => {
		if (data && !loading) {
			const launchDate = dayjs(
				data?.consortia?.content?.find(
					(item: { dateOfLaunch: string }) => item.dateOfLaunch != null,
				)?.dateOfLaunch,
			);
			const isLaunched = launchDate.isBefore(today) || launchDate.isSame(today);
			setOperational(isLaunched);
		}
	}, [data, loading, today]);
	// const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
	// 	setOperational(event.target.checked);
	// };

	const { t } = useTranslation();
	const nameOfUser = session?.profile?.given_name ?? t("app.guest_user");

	if (status === "loading" || operational === null || loading) {
		return (
			<AdminLayout>
				<Loading
					title={t("ui.info.loading.document", {
						document_type: t("nav.home").toLowerCase(),
					})}
					subtitle={t("ui.info.wait")}
				/>
			</AdminLayout>
		);
	}

	return (
		<AdminLayout
			title={t("welcome.greeting", { user: nameOfUser })}
			hideTitleBox={true}
		>
			{/* <FormControlLabel
				control={
					<Switch
						checked={operational}
						onChange={handleChange}
						inputProps={{ "aria-label": "controlled" }}
					/>
				}
				label={t("ui.action.toggle_on")}
			/> */}
			{<Button variant="outlined">Outlined</Button>}
			{<Button variant="contained">Contained</Button>}
			{<Button variant="text">Text</Button>}
			<Stack direction="column" spacing={2}>
				<Typography variant="h1">
					{t("welcome.greeting", { user: nameOfUser })}
				</Typography>
				<Typography variant="homePageText">
					{t("welcome.context", { consortium_name: "MOBIUS" })}
				</Typography>
				<Typography variant="h2">{t("consortium.your")}</Typography>
				{operational ? null : (
					<Typography variant="homePageText">
						{t("common.placeholder_text")}
					</Typography>
				)}
				{operational ? <OperatingWelcome /> : <ConsortiumDetails />}
				{operational ? null : <EnvironmentDetails />}
			</Stack>
		</AdminLayout>
	);
};

export async function getStaticProps({ locale }: { locale: string }) {
	return {
		props: {
			...(await serverSideTranslations(locale, [
				"application",
				"common",
				"validation",
			])),
		},
	};
}

export default Home;
