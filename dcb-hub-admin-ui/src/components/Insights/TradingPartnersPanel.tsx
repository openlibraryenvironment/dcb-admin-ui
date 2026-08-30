import { useState } from "react";
import { useTranslation } from "react-i18next";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
	Box,
	Card,
	CardContent,
	Skeleton,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TablePagination,
	TableRow,
	Typography,
} from "@mui/material";

import { useDcbRestClient } from "@hooks/useDcbRestClient";
import {
	StatsParams,
	dashboardMetricsQueryOptions,
	topPartnersQueryOptions,
} from "@helpers/statsApi";

const PANEL_MIN_HEIGHT = 320;
const PAGE_SIZES = [10, 25, 50];

/**
 * Who a library trades with, in both directions.
 *
 * Two data sources, because the question only has an answer once there is a "we":
 *
 *   In scope - /insights/top-partners, paged, ranked on the total with the borrow and
 *   supply split kept. Not derivable from the two top-ten lists below: a partner sixth in
 *   each can out-total one that is third in one and absent from the other. Paging matters
 *   for the same reason - the tail being reachable is the point of the endpoint.
 *
 *   Consortium-wide - the fixed top ten suppliers and borrowers from /dashboard-metrics,
 *   which is the only partner view that has a meaning with no library selected.
 */
export default function TradingPartnersPanel({
	params,
	libraryCode,
}: {
	params: StatsParams;
	libraryCode?: string;
}) {
	return libraryCode ? (
		<ScopedPartners params={params} libraryCode={libraryCode} />
	) : (
		<ConsortiumPartners params={params} />
	);
}

function PanelFrame({
	title,
	subtitle,
	children,
}: {
	title: string;
	subtitle: string;
	children: React.ReactNode;
}) {
	return (
		<Card variant="outlined">
			<CardContent>
				<Typography variant="h6" component="h3" gutterBottom>
					{title}
				</Typography>
				<Typography variant="body2" color="text.secondary" gutterBottom>
					{subtitle}
				</Typography>
				{children}
			</CardContent>
		</Card>
	);
}

function ScopedPartners({
	params,
	libraryCode,
}: {
	params: StatsParams;
	libraryCode: string;
}) {
	const { t } = useTranslation();
	const client = useDcbRestClient();
	const [page, setPage] = useState(0);
	const [size, setSize] = useState(PAGE_SIZES[0]);

	const { data, isLoading } = useQuery({
		...topPartnersQueryOptions(client, { ...params, libraryCode, page, size }),
		// Otherwise a page change unmounts the table into a spinner and the layout jumps -
		// a CLS failure as much as a UX one.
		placeholderData: keepPreviousData,
	});

	const rows = data?.content ?? [];

	return (
		<PanelFrame
			title={t("insights.charts.trading_partners.title")}
			subtitle={t("insights.charts.trading_partners.subtitle")}
		>
			{isLoading ? (
				<Skeleton variant="rounded" height={PANEL_MIN_HEIGHT} />
			) : rows.length === 0 ? (
				<Empty />
			) : (
				<>
					<TableContainer sx={{ maxHeight: 420 }}>
						<Table size="small" stickyHeader>
							<TableHead>
								<TableRow>
									<TableCell>
										{t("insights.charts.trading_partners.col_partner")}
									</TableCell>
									<TableCell align="right">
										{t("insights.charts.trading_partners.col_borrowed")}
									</TableCell>
									<TableCell align="right">
										{t("insights.charts.trading_partners.col_supplied")}
									</TableCell>
									<TableCell align="right">
										{t("insights.charts.trading_partners.col_total")}
									</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{rows.map((row) => (
									<TableRow key={row.partnerCode} hover>
										<TableCell>
											{row.partnerName ?? row.partnerCode}
											{row.partnerName ? (
												<Typography
													variant="caption"
													component="span"
													color="text.secondary"
													sx={{ ml: 1 }}
												>
													{row.partnerCode}
												</Typography>
											) : null}
										</TableCell>
										<TableCell align="right">
											{row.borrowedFromCount.toLocaleString()}
										</TableCell>
										<TableCell align="right">
											{row.suppliedToCount.toLocaleString()}
										</TableCell>
										<TableCell align="right">
											{row.totalCount.toLocaleString()}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</TableContainer>
					<TablePagination
						component="div"
						// totalSize counts PARTNERS, not requests, so it drives this directly.
						count={data?.totalSize ?? 0}
						page={page}
						onPageChange={(_e, next) => setPage(next)}
						rowsPerPage={size}
						rowsPerPageOptions={PAGE_SIZES}
						onRowsPerPageChange={(e) => {
							setSize(parseInt(e.target.value, 10));
							setPage(0);
						}}
						labelRowsPerPage={t(
							"insights.charts.trading_partners.rows_per_page",
						)}
					/>
				</>
			)}
		</PanelFrame>
	);
}

function ConsortiumPartners({ params }: { params: StatsParams }) {
	const { t } = useTranslation();
	const client = useDcbRestClient();

	const { data, isLoading } = useQuery(
		dashboardMetricsQueryOptions(client, params),
	);

	const suppliers = data?.topSuppliers ?? [];
	const borrowers = data?.topBorrowers ?? [];

	return (
		<PanelFrame
			title={t("insights.charts.trading_partners.title")}
			subtitle={t("insights.charts.trading_partners.subtitle_consortium")}
		>
			{isLoading ? (
				<Skeleton variant="rounded" height={PANEL_MIN_HEIGHT} />
			) : suppliers.length === 0 && borrowers.length === 0 ? (
				<Empty />
			) : (
				<Box
					sx={{
						display: "grid",
						gap: 3,
						gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
					}}
				>
					<PartnerList
						headingKey="insights.charts.trading_partners.top_suppliers"
						rows={suppliers}
					/>
					<PartnerList
						headingKey="insights.charts.trading_partners.top_borrowers"
						rows={borrowers}
					/>
				</Box>
			)}
		</PanelFrame>
	);
}

function PartnerList({
	headingKey,
	rows,
}: {
	headingKey: string;
	rows: {
		partnerCode: string;
		partnerName: string | null;
		requestCount: number;
	}[];
}) {
	const { t } = useTranslation();

	return (
		<TableContainer>
			<Table size="small">
				<TableHead>
					<TableRow>
						<TableCell>{t(headingKey)}</TableCell>
						<TableCell align="right">
							{t("insights.charts.trading_partners.col_requests")}
						</TableCell>
					</TableRow>
				</TableHead>
				<TableBody>
					{rows.map((row) => (
						<TableRow key={row.partnerCode} hover>
							<TableCell>{row.partnerName ?? row.partnerCode}</TableCell>
							<TableCell align="right">
								{row.requestCount.toLocaleString()}
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</TableContainer>
	);
}

function Empty() {
	const { t } = useTranslation();

	return (
		<Box
			sx={{
				minHeight: PANEL_MIN_HEIGHT,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
			}}
		>
			<Typography color="text.secondary">{t("insights.no_data")}</Typography>
		</Box>
	);
}
