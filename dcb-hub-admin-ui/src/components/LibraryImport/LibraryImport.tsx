import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	Alert,
	AlertTitle,
	Box,
	Button,
	Checkbox,
	Chip,
	Dialog,
	DialogContent,
	DialogTitle,
	Divider,
	IconButton,
	LinearProgress,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Typography,
} from "@mui/material";
import { Close, CloudUpload, Download } from "@mui/icons-material";

import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { getHostLmsCodes } from "@queries/getHostLmsCodes";
import { getLibraries } from "@queries/getLibraries";
import {
	buildImportTemplate,
	parseLibraryImport,
	summariseImport,
	type LibraryImportRow,
} from "@helpers/libraryImport";
import {
	LIBRARY_IMPORT_ACCEPT,
	LIBRARY_IMPORT_COLUMNS,
	LIBRARY_IMPORT_MAX_BYTES,
	LIBRARY_IMPORT_MAX_ROWS,
} from "@constants/libraryImport";
import { applyLibraryImport, type ImportOutcome } from "./applyLibraryImport";
import { LIBRARY_COUNT_QUERY_KEY } from "@/queryOptions/setup";
import { fileSizeConvertor } from "@helpers/fileSizeConverter";
import type {
	LoadHostLmsCodesQueryVariables,
	LoadLibrariesQueryVariables,
} from "@generated/graphql";

interface LibraryImportProps {
	show: boolean;
	onClose: () => void;
	consortiumGroupId?: string | null;
	/** Fired once rows have been applied, with how many succeeded. */
	onImported?: (created: number) => void;
}

/**
 * Creating many libraries from one spreadsheet — W-10.
 *
 * <h2>Dry run first, always</h2>
 *
 * Choosing a file parses and judges it and writes NOTHING. The user reads a per-row
 * verdict, ticks what they want, and only then is anything sent. A bulk import that
 * applies first and reports afterwards leaves a consortium in a state nobody chose and
 * nobody can describe.
 *
 * <h2>Updates are opted into, one at a time</h2>
 *
 * A row whose agency code matches a library that already exists is shown as an update and
 * is UNTICKED. Re-uploading last month's file by accident therefore changes nothing at all
 * until somebody deliberately says otherwise - which is the difference between a useful
 * import and a dangerous one.
 *
 * <h2>Why a plain table and not the data grid</h2>
 *
 * MUI X is licensed here and is the right answer for a server-paged grid over a corpus.
 * This is at most a thousand client-held rows from one file, and what it needs is a
 * checkbox column and a wrapping reason cell, with no filtering, sorting, grouping or
 * export. Reaching for the premium grid would buy virtualisation nobody needs and cost a
 * heavier bundle on a route that is used once.
 */
export default function LibraryImport({
	show,
	onClose,
	consortiumGroupId,
	onImported,
}: LibraryImportProps) {
	const { t } = useTranslation();
	const gqlClient = useGraphQLClient();
	const queryClient = useQueryClient();
	const fileInput = useRef<HTMLInputElement>(null);

	const [fileName, setFileName] = useState<string | null>(null);
	const [fileError, setFileError] = useState<string | null>(null);
	const [rows, setRows] = useState<LibraryImportRow[] | null>(null);
	const [unknownHeaders, setUnknownHeaders] = useState<string[]>([]);
	const [progress, setProgress] = useState<{
		done: number;
		total: number;
	} | null>(null);
	const [outcomes, setOutcomes] = useState<ImportOutcome[] | null>(null);

	// Both are needed to judge a row, and both are cheap and change rarely. Asked ONCE
	// while the dialog is open rather than per row - a per-row lookup over 500 rows is
	// exactly the fan-out this feature exists to avoid.
	const { data: hostLmsData } = useQuery({
		queryKey: ["LoadHostLmsCodes", "libraryImport"],
		enabled: show,
		staleTime: 5 * 60 * 1000,
		queryFn: () =>
			gqlClient.request<any, LoadHostLmsCodesQueryVariables>(getHostLmsCodes, {
				query: "",
				pagesize: 1000,
			}),
	});

	const { data: librariesData } = useQuery({
		queryKey: ["LoadLibraries", "libraryImport"],
		enabled: show,
		staleTime: 60 * 1000,
		queryFn: () =>
			gqlClient.request<any, LoadLibrariesQueryVariables>(getLibraries, {
				query: "",
				pageno: 0,
				// The membership, which the scale constants put in the hundreds.
				// Bounded by the consortium, not by the corpus.
				pagesize: 1000,
				order: "agencyCode",
				orderBy: "ASC",
			}),
	});

	const knownHostLmsCodes = useMemo(
		() =>
			(hostLmsData?.hostLms?.content ?? [])
				.map((system: any) => system?.code)
				.filter(Boolean) as string[],
		[hostLmsData],
	);

	const existingLibraries = useMemo(
		() =>
			(librariesData?.libraries?.content ?? []).map((library: any) => ({
				id: library.id,
				agencyCode: library.agencyCode,
			})),
		[librariesData],
	);

	const summary = rows ? summariseImport(rows) : null;

	const reset = () => {
		setFileName(null);
		setFileError(null);
		setRows(null);
		setUnknownHeaders([]);
		setProgress(null);
		setOutcomes(null);
	};

	const handleClose = () => {
		reset();
		onClose();
	};

	const handleFile = async (file: File | null) => {
		if (!file) return;
		reset();

		// Refused before reading. An unbounded parse of an arbitrary upload is how a tab
		// locks up, and "the browser froze" is indistinguishable from "it is broken".
		if (file.size > LIBRARY_IMPORT_MAX_BYTES) {
			setFileError(
				t("setup.import.too_large", {
					size: fileSizeConvertor(file.size),
					max: fileSizeConvertor(LIBRARY_IMPORT_MAX_BYTES),
				}),
			);
			return;
		}

		setFileName(file.name);
		const contents = await file.text();
		const result = parseLibraryImport(contents, {
			knownHostLmsCodes,
			existingLibraries,
			messages: {
				requiredMissing: (column) =>
					t("setup.import.problem.required", { column }),
				notANumber: (column) =>
					t("setup.import.problem.not_a_number", { column }),
				unknownHostLms: (code) =>
					t("setup.import.problem.unknown_host_lms", {
						code,
						known: knownHostLmsCodes.join(", "),
					}),
				duplicateAgencyCode: (code) =>
					t("setup.import.problem.duplicate", { code }),
				latitudeRange: t("setup.import.problem.latitude_range"),
				longitudeRange: t("setup.import.problem.longitude_range"),
				emailInvalid: (column) => t("setup.import.problem.email", { column }),
			},
		});

		setRows(result.rows);
		setUnknownHeaders(result.unknownHeaders);

		if (result.rows.length === 0) {
			setFileError(t("setup.import.no_rows"));
		}
	};

	const toggleRow = (line: number) =>
		setRows(
			(current) =>
				current?.map((row) =>
					row.line === line && row.verdict !== "reject"
						? { ...row, selected: !row.selected }
						: row,
				) ?? null,
		);

	const { mutateAsync: apply, isPending: isApplying } = useMutation({
		mutationFn: (selected: LibraryImportRow[]) =>
			applyLibraryImport(gqlClient, selected, {
				consortiumGroupId,
				onProgress: (done, total) => setProgress({ done, total }),
			}),
		onSuccess: (results) => {
			setOutcomes(results);
			setProgress(null);
			// Narrow keys. Every list of libraries is stale now, but nothing else is.
			queryClient.invalidateQueries({ queryKey: ["LoadLibraries"] });
			queryClient.invalidateQueries({ queryKey: LIBRARY_COUNT_QUERY_KEY });
			onImported?.(results.filter((result) => result.ok).length);
		},
	});

	const downloadTemplate = () => {
		const blob = new Blob([buildImportTemplate()], {
			type: "text/csv;charset=utf-8",
		});
		const url = URL.createObjectURL(blob);
		const anchor = document.createElement("a");
		anchor.href = url;
		anchor.download = "dcb-libraries-template.csv";
		anchor.click();
		URL.revokeObjectURL(url);
	};

	const failures = outcomes?.filter((outcome) => !outcome.ok) ?? [];

	return (
		<Dialog
			open={show}
			onClose={(_event, reason) => {
				// A misclick on the backdrop must not discard a reviewed file.
				if (reason === "backdropClick" || isApplying) return;
				handleClose();
			}}
			aria-labelledby="library-import-title"
			fullWidth
			maxWidth="lg"
		>
			<DialogTitle id="library-import-title" variant="modalTitle">
				{t("setup.import.title")}
			</DialogTitle>
			<IconButton
				onClick={handleClose}
				aria-label={t("ui.actions.close")}
				disabled={isApplying}
				sx={{ position: "absolute", right: 8, top: 8 }}
			>
				<Close />
			</IconButton>
			<Divider aria-hidden="true" />
			<Box sx={{ height: 4 }}>{isApplying && <LinearProgress />}</Box>

			<DialogContent>
				<Stack spacing={2}>
					<Typography>{t("setup.import.explanation")}</Typography>

					<Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
						<Button
							startIcon={<Download />}
							variant="outlined"
							onClick={downloadTemplate}
						>
							{t("setup.import.download_template")}
						</Button>

						{/* A real button, not a styled drop zone. Drag-and-drop may be an
						    addition but never the only route in (WCAG 2.5.7), and a
						    click-to-browse control is the one a keyboard reaches. */}
						<Button
							startIcon={<CloudUpload />}
							variant="contained"
							onClick={() => fileInput.current?.click()}
							disabled={isApplying}
						>
							{t("setup.import.choose_file")}
						</Button>
						<input
							ref={fileInput}
							type="file"
							accept={LIBRARY_IMPORT_ACCEPT}
							hidden
							onChange={(event) => {
								void handleFile(event.target.files?.[0] ?? null);
								// Cleared so choosing the SAME file again re-fires change;
								// without this, correcting a sheet and re-picking it does
								// nothing and looks like the dialog has hung.
								event.target.value = "";
							}}
						/>
					</Stack>

					<Typography variant="body2" sx={{ color: "text.secondary" }}>
						{t("setup.import.limits", {
							rows: LIBRARY_IMPORT_MAX_ROWS,
							size: fileSizeConvertor(LIBRARY_IMPORT_MAX_BYTES),
						})}
					</Typography>

					{fileError && (
						<Alert severity="error" role="alert">
							{fileError}
						</Alert>
					)}

					{unknownHeaders.length > 0 && (
						<Alert severity="info">
							{t("setup.import.unknown_headers", {
								headers: unknownHeaders.join(", "),
							})}
						</Alert>
					)}

					{/* The summary is the thing that changed, so it is announced. A count
					    that only ever changes visually does not exist for a screen-reader
					    user. */}
					<Box aria-live="polite" aria-atomic="true">
						{summary && !outcomes && (
							<Alert severity={summary.reject > 0 ? "warning" : "success"}>
								<AlertTitle>{fileName}</AlertTitle>
								{t("setup.import.summary", {
									create: summary.create,
									update: summary.update,
									reject: summary.reject,
								})}
							</Alert>
						)}

						{progress && (
							<Alert severity="info" role="status">
								{t("setup.import.applying", {
									done: progress.done,
									total: progress.total,
								})}
							</Alert>
						)}

						{outcomes && (
							<Alert severity={failures.length > 0 ? "warning" : "success"}>
								<AlertTitle>{t("setup.import.result_title")}</AlertTitle>
								{t("setup.import.result", {
									applied: outcomes.length - failures.length,
									failed: failures.length,
								})}
							</Alert>
						)}
					</Box>

					{failures.length > 0 && (
						<Alert severity="error">
							<AlertTitle>{t("setup.import.failures_title")}</AlertTitle>
							<Stack spacing={0.5}>
								{failures.map((failure) => (
									<Typography key={failure.line} variant="body2">
										{t("setup.import.failure_line", {
											line: failure.line,
											code: failure.agencyCode,
											reason: failure.error,
										})}
									</Typography>
								))}
							</Stack>
						</Alert>
					)}

					{rows && rows.length > 0 && !outcomes && (
						<TableContainer sx={{ maxHeight: 420, overflowX: "auto" }}>
							<Table size="small" stickyHeader>
								<caption style={{ captionSide: "top" }}>
									{t("setup.import.table_caption")}
								</caption>
								<TableHead>
									<TableRow>
										<TableCell padding="checkbox">
											{t("setup.import.column.apply")}
										</TableCell>
										<TableCell>{t("setup.import.column.line")}</TableCell>
										<TableCell>{t("setup.import.column.verdict")}</TableCell>
										<TableCell>
											{t("setup.import.column.agency_code")}
										</TableCell>
										<TableCell>{t("setup.import.column.full_name")}</TableCell>
										<TableCell>{t("setup.import.column.notes")}</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{rows.map((row) => (
										<TableRow key={row.line}>
											<TableCell padding="checkbox">
												<Checkbox
													checked={row.selected}
													disabled={row.verdict === "reject" || isApplying}
													onChange={() => toggleRow(row.line)}
													slotProps={{
														// Named per row: forty checkboxes all
														// called "apply" are forty identical
														// announcements.
														input: {
															"aria-label": t("setup.import.apply_row", {
																line: row.line,
																code: row.values.agencyCode || "-",
															}),
														},
													}}
												/>
											</TableCell>
											<TableCell>{row.line}</TableCell>
											<TableCell>
												{/* The verdict is a word, not a colour. */}
												<Chip
													size="small"
													label={t(`setup.import.verdict.${row.verdict}`)}
													color={
														row.verdict === "reject"
															? "error"
															: row.verdict === "update"
																? "warning"
																: "success"
													}
													variant="outlined"
												/>
											</TableCell>
											<TableCell>{row.values.agencyCode}</TableCell>
											<TableCell>{row.values.fullName}</TableCell>
											<TableCell sx={{ whiteSpace: "normal" }}>
												{row.verdict === "reject"
													? row.problems.join(" ")
													: row.verdict === "update"
														? t("setup.import.will_update")
														: ""}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</TableContainer>
					)}

					<Stack
						direction={{ xs: "column-reverse", sm: "row" }}
						spacing={2}
						sx={{ justifyContent: "flex-end", pt: 1 }}
					>
						<Button onClick={handleClose} disabled={isApplying}>
							{outcomes ? t("ui.actions.close") : t("ui.actions.cancel")}
						</Button>
						{!outcomes && (
							<Button
								variant="contained"
								disabled={!summary || summary.selected === 0 || isApplying}
								onClick={() => rows && apply(rows)}
							>
								{t("setup.import.apply", { count: summary?.selected ?? 0 })}
							</Button>
						)}
					</Stack>

					<Divider />

					<details>
						<summary>
							<Typography component="span">
								{t("setup.import.columns_heading")}
							</Typography>
						</summary>
						<TableContainer sx={{ overflowX: "auto", mt: 1 }}>
							<Table size="small">
								<TableHead>
									<TableRow>
										<TableCell>{t("setup.import.column.name")}</TableCell>
										<TableCell>{t("setup.import.column.required")}</TableCell>
										<TableCell>
											{t("setup.import.column.description")}
										</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{LIBRARY_IMPORT_COLUMNS.map((column) => (
										<TableRow key={column.key}>
											<TableCell>
												<code>{column.key}</code>
											</TableCell>
											<TableCell>
												{column.required
													? t("ui.actions.yes")
													: t("ui.actions.no")}
											</TableCell>
											<TableCell sx={{ whiteSpace: "normal" }}>
												{t(column.descriptionKey)}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</TableContainer>
					</details>
				</Stack>
			</DialogContent>
		</Dialog>
	);
}
