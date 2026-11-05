import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import {
	Alert,
	CircularProgress,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Typography,
} from "@mui/material";

import { useGraphQLClient } from "@hooks/useGraphQLClient";
import {
	PREVIOUS_SUPPLIERS_SHOWN,
	inactiveSupplierRequestsQuery,
} from "@/queryOptions/inactiveSupplierRequests";

const COLUMNS = [
	["dateCreated", "patron_request.previous_suppliers.moved_off"],
	["localAgency", "patron_request.previous_suppliers.agency"],
	["hostLmsCode", "patron_request.previous_suppliers.host_lms"],
	["localItemBarcode", "patron_request.previous_suppliers.item_barcode"],
	["localItemId", "patron_request.previous_suppliers.item_id"],
	["localItemLocationCode", "patron_request.previous_suppliers.location"],
	["localItemType", "patron_request.previous_suppliers.item_type"],
	["canonicalItemType", "patron_request.previous_suppliers.canonical_type"],
	["localBibId", "patron_request.previous_suppliers.bib_id"],
] as const;

/** The suppliers a request was moved off by re-resolution, newest first. */
export default function PreviousSuppliers({
	patronRequestId,
}: {
	patronRequestId: string;
}) {
	const { t } = useTranslation();
	const gqlClient = useGraphQLClient();
	const { data, isLoading, isError } = useQuery(
		inactiveSupplierRequestsQuery(gqlClient, patronRequestId),
	);
	const rows = data?.inactiveSupplierRequests?.content ?? [];
	const total = data?.inactiveSupplierRequests?.totalSize ?? 0;

	return (
		<Stack spacing={2}>
			<Typography variant="accordionSummary" component="h2">
				{t("patron_request.previous_suppliers.title")}
			</Typography>
			<Typography variant="body2">
				{t("patron_request.previous_suppliers.description")}
			</Typography>
			{isLoading ? (
				<CircularProgress aria-label={t("common.loading")} />
			) : isError ? (
				<Alert severity="error">
					{t("patron_request.previous_suppliers.error")}
				</Alert>
			) : rows.length === 0 ? (
				<Typography>{t("patron_request.previous_suppliers.none")}</Typography>
			) : (
				<TableContainer>
					<Table
						size="small"
						aria-label={t("patron_request.previous_suppliers.title")}
					>
						<TableHead>
							<TableRow>
								{COLUMNS.map(([field, labelKey]) => (
									<TableCell key={field} component="th" scope="col">
										{t(labelKey)}
									</TableCell>
								))}
							</TableRow>
						</TableHead>
						<TableBody>
							{rows.map((row) =>
								row ? (
									<TableRow key={row.id}>
										{COLUMNS.map(([field]) => (
											<TableCell key={field}>
												{field === "dateCreated"
													? row.dateCreated &&
														dayjs(row.dateCreated).format("YYYY-MM-DD HH:mm")
													: row[field]}
											</TableCell>
										))}
									</TableRow>
								) : null,
							)}
						</TableBody>
					</Table>
				</TableContainer>
			)}
			{total > PREVIOUS_SUPPLIERS_SHOWN && (
				<Typography variant="body2">
					{t("patron_request.previous_suppliers.capped", {
						shown: PREVIOUS_SUPPLIERS_SHOWN,
						total,
					})}
				</Typography>
			)}
		</Stack>
	);
}
