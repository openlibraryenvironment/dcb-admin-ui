import { useQuery } from "@apollo/client";
import { Stack, Tab, Tabs, Typography } from "@mui/material";
import Grid from "@mui/material/Unstable_Grid2";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import { Dispatch, SetStateAction } from "react";
import {
	handleMappingsTabChange,
	handlePatronRequestTabChange,
	handleSupplierRequestTabChange,
	handleTabChange,
} from "src/helpers/navigation/handleTabChange";
import { getPatronRequests } from "src/queries/queries";

type MultipleTabNavType = {
	tabIndex: number;
	subTabIndex: number;
	setTabIndex: Dispatch<SetStateAction<number>>;
	setSubTabIndex: Dispatch<SetStateAction<number>>;
	hostLmsCode: string;
	libraryId: string;
	type: string;
	agencyCode: string;
	presetTotal?: number;
};

export default function MultipleTabNavigation({
	tabIndex,
	subTabIndex,
	setTabIndex,
	setSubTabIndex,
	hostLmsCode,
	libraryId,
	type,
	agencyCode,
	presetTotal,
}: MultipleTabNavType) {
	const { t } = useTranslation();
	const router = useRouter();

	const queries = {
		exception: `patronHostlmsCode: "${hostLmsCode}"AND status: "ERROR"`,
		outOfSequence: `patronHostlmsCode: "${hostLmsCode}" AND NOT status:"ERROR" AND NOT status: "NO_ITEMS_SELECTABLE_AT_ANY_AGENCY" AND NOT status:"CANCELLED" AND NOT status:"FINALISED" AND NOT status:"COMPLETED" AND outOfSequenceFlag:true`,
		inProgress: `patronHostlmsCode: "${hostLmsCode}"AND NOT status:"ERROR" AND NOT status: "NO_ITEMS_SELECTABLE_AT_ANY_AGENCY" AND NOT status: "CANCELLED" AND NOT status: "FINALISED" AND NOT status:"COMPLETED" AND outOfSequenceFlag:false`,
		finished: `patronHostlmsCode: "${hostLmsCode}"AND (status: "NO_ITEMS_SELECTABLE_AT_ANY_AGENCY" OR status: "CANCELLED" OR status: "FINALISED" OR status:"COMPLETED")`,
		supplier: `localAgency: "${agencyCode}"`,

		// Add mapping queries here when we want to display totals
	};

	const { data: exceptionData, loading: exceptionLoading } = useQuery(
		getPatronRequests,
		{
			variables: {
				query: queries.exception,
				pageno: 0,
				pagesize: 10000,
				order: "dateCreated",
				orderBy: "DESC",
			},
			skip: !hostLmsCode || type != "patronRequests",
		},
	);

	const { data: outOfSequenceData, loading: outOfSequenceLoading } = useQuery(
		getPatronRequests,
		{
			variables: {
				query: queries.outOfSequence,
				pageno: 0,
				pagesize: 10000,
				order: "dateCreated",
				orderBy: "DESC",
			},
			skip: !hostLmsCode || type != "patronRequests",
		},
	);

	const { data: inProgressData, loading: inProgressLoading } = useQuery(
		getPatronRequests,
		{
			variables: {
				query: queries.inProgress,
				pageno: 0,
				pagesize: 10000,
				order: "dateCreated",
				orderBy: "DESC",
			},
			skip: !hostLmsCode || type != "patronRequests",
		},
	);

	const { data: finishedData, loading: finishedLoading } = useQuery(
		getPatronRequests,
		{
			variables: {
				query: queries.finished,
				pageno: 0,
				pagesize: 10000,
				order: "dateCreated",
				orderBy: "DESC",
			},
			skip: !hostLmsCode || type != "patronRequests",
		},
	);

	console.log(presetTotal);

	const totalSizes = {
		exception: exceptionData?.patronRequests?.totalSize || 0,
		outOfSequence: outOfSequenceData?.patronRequests?.totalSize || 0,
		inProgress: inProgressData?.patronRequests?.totalSize || 0,
		finished: finishedData?.patronRequests?.totalSize || 0,
		supplier: presetTotal || 0,
		all:
			(exceptionData?.patronRequests?.totalSize || 0) +
			(outOfSequenceData?.patronRequests?.totalSize || 0) +
			(inProgressData?.patronRequests?.totalSize || 0) +
			(finishedData?.patronRequests?.totalSize || 0),
	};

	return (
		<Grid xs={4} sm={8} md={12}>
			<Stack spacing={1}>
				<Tabs
					value={tabIndex}
					onChange={(event, value) => {
						handleTabChange(event, value, router, setTabIndex, libraryId);
					}}
					aria-label="Library navigation"
					variant="scrollable"
					scrollButtons="auto"
				>
					<Tab label={t("nav.libraries.profile")} />
					<Tab label={t("nav.libraries.service")} />
					<Tab label={t("nav.libraries.settings")} />
					<Tab label={t("nav.mappings.name")} />
					<Tab label={t("nav.libraries.patronRequests.name")} />
					<Tab label={t("nav.libraries.supplierRequests.name")} />
					<Tab label={t("nav.libraries.contacts")} />
					<Tab label={t("nav.locations")} />
				</Tabs>
				<Typography variant="h2" sx={{ fontWeight: "bold" }}>
					{type == "mappings"
						? t("nav.mappings.name")
						: type == "patronRequests"
							? t("nav.patronRequests")
							: t("nav.libraries.supplierRequests.name")}
				</Typography>

				{type == "mappings" ? (
					<Tabs
						value={subTabIndex}
						onChange={(event, value) => {
							handleMappingsTabChange(
								event,
								value,
								router,
								setSubTabIndex,
								libraryId,
							);
						}}
						aria-label={"Library mappings navigiation"}
						variant="scrollable"
						scrollButtons="auto"
					>
						<Tab
							label={
								<Typography variant="subTabTitle">
									{t("mappings.item_type_ref_value_short")}
								</Typography>
							}
						/>
						<Tab
							label={
								<Typography variant="subTabTitle">
									{t("mappings.item_type_num_range_short")}
								</Typography>
							}
						/>
						<Tab
							label={
								<Typography variant="subTabTitle">
									{t("mappings.location_ref_value_short")}
								</Typography>
							}
						/>
						<Tab
							label={
								<Typography variant="subTabTitle">
									{t("mappings.patron_type_ref_value_short")}
								</Typography>
							}
						/>
						<Tab
							label={
								<Typography variant="subTabTitle">
									{t("mappings.patron_type_num_range_short")}
								</Typography>
							}
						/>
						<Tab
							label={
								<Typography variant="subTabTitle">
									{t("mappings.all_ref_value_short")}
								</Typography>
							}
						/>
						<Tab
							label={
								<Typography variant="subTabTitle">
									{t("mappings.all_num_range_short")}
								</Typography>
							}
						/>
					</Tabs>
				) : null}

				{type == "patronRequests" ? (
					<Tabs
						value={subTabIndex}
						onChange={(event, value) => {
							handlePatronRequestTabChange(
								event,
								value,
								router,
								setSubTabIndex,
								libraryId,
							);
						}}
						aria-label={"Library patron request navigation"}
					>
						<Tab
							label={
								<Typography variant="subTabTitle">
									{t("libraries.patronRequests.exception_short", {
										number: exceptionLoading
											? t("common.loading")
											: totalSizes.exception,
									})}
								</Typography>
							}
						/>
						<Tab
							label={
								<Typography variant="subTabTitle">
									{t("libraries.patronRequests.out_of_sequence_short", {
										number: outOfSequenceLoading
											? t("common.loading")
											: totalSizes.outOfSequence,
									})}{" "}
								</Typography>
							}
						/>
						<Tab
							label={
								<Typography variant="subTabTitle">
									{t("libraries.patronRequests.active_short", {
										number: inProgressLoading
											? t("common.loading")
											: totalSizes.inProgress,
									})}
								</Typography>
							}
						/>
						<Tab
							label={
								<Typography variant="subTabTitle">
									{t("libraries.patronRequests.completed_short", {
										number: finishedLoading
											? t("common.loading")
											: totalSizes.finished,
									})}
								</Typography>
							}
						/>
						<Tab
							label={
								<Typography variant="subTabTitle">
									{t("libraries.patronRequests.all_short", {
										number: totalSizes.all,
									})}
								</Typography>
							}
						/>
					</Tabs>
				) : null}
				{type == "supplierRequests" ? (
					<Tabs
						value={subTabIndex}
						onChange={(event, value) => {
							handleSupplierRequestTabChange(
								event,
								value,
								router,
								setSubTabIndex,
								libraryId,
							);
						}}
						aria-label={"Library supplier request navigation"}
					>
						<Tab
							label={
								<Typography variant="subTabTitle">
									{t("libraries.patronRequests.all_supplier_short", {
										number: totalSizes.supplier,
									})}
								</Typography>
							}
						/>
					</Tabs>
				) : null}
			</Stack>
		</Grid>
	);
}
