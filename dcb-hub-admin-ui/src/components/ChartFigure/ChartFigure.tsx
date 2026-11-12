import { useId, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
	Box,
	Button,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TablePagination,
	TableRow,
} from "@mui/material";
import { TableChartOutlined } from "@mui/icons-material";

export interface ChartTableSeries {
	label: string;
	/** One per category, in the same order. */
	values: readonly (number | null | undefined)[];
	format?: (value: number) => string;
}

export interface ChartFigureProps {
	/** Names the figure, and captions its table. */
	label: string;
	/** Heads the first column: what each bar, point or row stands for. */
	categoryLabel: string;
	categories: readonly string[];
	series: readonly ChartTableSeries[];
	children: ReactNode;
}

// The audit chart draws up to 1,000 buckets
const PAGE_SIZE = 100;

/**
 * A chart and its text alternative, WCAG 1.1.1: the figure is named, and the numbers it
 * draws can be read as a table built from the same arrays. Every chart goes through here;
 * chartFigureCoverage.test.ts fails on one that does not.
 */
export default function ChartFigure({
	label,
	categoryLabel,
	categories,
	series,
	children,
}: ChartFigureProps) {
	const { t, i18n } = useTranslation();
	const tableId = useId();
	const [open, setOpen] = useState(false);
	const [page, setPage] = useState(0);

	// The data can shrink under a page the user had moved to
	const lastPage = Math.max(0, Math.ceil(categories.length / PAGE_SIZE) - 1);
	const current = Math.min(page, lastPage);
	const start = current * PAGE_SIZE;
	const shown = categories.slice(start, start + PAGE_SIZE);
	const number = new Intl.NumberFormat(i18n.language);

	const valueAt = (entry: ChartTableSeries, index: number) => {
		const value = entry.values[index];
		if (value === null || value === undefined) return "—";
		return entry.format ? entry.format(value) : number.format(value);
	};

	return (
		<Box component="figure" aria-label={label} sx={{ m: 0 }}>
			{children}
			<Button
				size="small"
				startIcon={<TableChartOutlined />}
				aria-expanded={open}
				aria-controls={tableId}
				// Every chart has one; the name says which (2.4.6)
				aria-label={t(
					open ? "ui.chart_table.hide_named" : "ui.chart_table.show_named",
					{ label },
				)}
				onClick={() => setOpen((was) => !was)}
				sx={{ mt: 1 }}
			>
				{t(open ? "ui.chart_table.hide" : "ui.chart_table.show")}
			</Button>
			<Box id={tableId} hidden={!open}>
				{open && (
					<>
						<TableContainer sx={{ maxHeight: 420 }}>
							<Table size="small" stickyHeader>
								<caption>{label}</caption>
								<TableHead>
									<TableRow>
										<TableCell>{categoryLabel}</TableCell>
										{series.map((entry) => (
											<TableCell key={entry.label} align="right">
												{entry.label}
											</TableCell>
										))}
									</TableRow>
								</TableHead>
								<TableBody>
									{shown.map((category, offset) => (
										<TableRow key={start + offset}>
											<TableCell component="th" scope="row">
												{category}
											</TableCell>
											{series.map((entry) => (
												<TableCell key={entry.label} align="right">
													{valueAt(entry, start + offset)}
												</TableCell>
											))}
										</TableRow>
									))}
								</TableBody>
							</Table>
						</TableContainer>
						{categories.length > PAGE_SIZE && (
							<TablePagination
								component="div"
								count={categories.length}
								page={current}
								rowsPerPage={PAGE_SIZE}
								rowsPerPageOptions={[PAGE_SIZE]}
								onPageChange={(_event, next) => setPage(next)}
								labelDisplayedRows={({ from, to, count }) =>
									t("ui.chart_table.rows_shown", { from, to, count })
								}
								getItemAriaLabel={(type) =>
									t(
										type === "next"
											? "ui.chart_table.next_page"
											: type === "previous"
												? "ui.chart_table.previous_page"
												: type === "first"
													? "ui.chart_table.first_page"
													: "ui.chart_table.last_page",
									)
								}
							/>
						)}
					</>
				)}
			</Box>
		</Box>
	);
}
