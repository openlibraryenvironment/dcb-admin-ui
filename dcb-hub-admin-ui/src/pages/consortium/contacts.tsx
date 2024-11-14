import { AdminLayout } from "@layout";
import { Tab, Tabs } from "@mui/material";
import { GetServerSideProps, GetServerSidePropsContext, NextPage } from "next";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useRouter } from "next/router";
import Grid from "@mui/material/Unstable_Grid2";
import { useState } from "react";
import { getConsortiaContacts, updatePerson } from "src/queries/queries";
import { useQuery } from "@apollo/client";
import { Person } from "@models/Person";
import { ClientDataGrid } from "@components/ClientDataGrid";

const Contacts: NextPage = () => {
	const { t } = useTranslation();
	const [tabIndex, setTabIndex] = useState(3); // needs to match order of tab
	const router = useRouter();
	const { data } = useQuery(getConsortiaContacts, {
		variables: {
			order: "id",
			orderBy: "DESC",
			pageno: 0,
			pagesize: 10,
		},
	});

	const consortiumContacts: Person[] = data?.consortia?.content[0]?.contacts;
	console.log(consortiumContacts);
	// Need custom tab components for accessibility + more

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
					<ClientDataGrid
						columns={[
							{
								field: "role",
								headerName: t("libraries.contacts.role"),
								minWidth: 50,
								editable: true,
								flex: 0.5,
							},
							{
								field: "name",
								headerName: t("libraries.contacts.name"),
								minWidth: 50,
								editable: true,
								flex: 0.7,
								valueGetter: (value: string, row: Person) => {
									return `${row.firstName} ${row.lastName}`.trim();
								},
								valueSetter: (value: string, row: Person) => {
									// if we can remove regex would be better
									const [firstName, ...rest] = value.trim().split(/\s+/); // Split by any whitespace
									const lastName = rest.join(" "); // Join the remaining parts as the last name
									return { ...row, firstName, lastName };
								},
							},
							{
								field: "email",
								headerName: t("libraries.contacts.email"),
								minWidth: 50,
								editable: true,
								flex: 0.7,
							},
							{
								field: "isPrimaryContact",
								headerName: t("libraries.contacts.primary"),
								minWidth: 50,
								editable: true,
								flex: 0.3,
							},
						]}
						data={consortiumContacts}
						type="consortiumContact"
						selectable={false}
						sortModel={[{ field: "isPrimaryContact", sort: "desc" }]}
						noDataTitle={"No contacts found for this consortium."}
						toolbarVisible="search-only"
						disableHoverInteractions={true}
						editQuery={updatePerson}
					/>
				</Grid>
			</Grid>
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

export default Contacts;
