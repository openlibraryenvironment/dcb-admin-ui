import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	Box,
	Button,
	Checkbox,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Divider,
	FormControl,
	FormControlLabel,
	FormLabel,
	Radio,
	RadioGroup,
	Stack,
	TextField,
	Typography,
} from "@mui/material";
import {
	GridColDef,
	GridColumnVisibilityModel,
} from "@mui/x-data-grid-premium";
import { getExportColumns } from "@helpers/dataGrid/getExportColumns";
import { ExportFormat, RunExportOptions } from "@hooks/useGridExport";

interface ExportWizardProps {
	open: boolean;
	onClose: () => void;
	columns: GridColDef[];
	columnVisibilityModel: GridColumnVisibilityModel;
	/** Number of checkbox-selected rows (enables the "selected rows" scope). */
	selectedCount: number;
	onExport: (options: RunExportOptions) => void;
}

type ExportScope = "all" | "selected";

export default function ExportWizard({
	open,
	onClose,
	columns,
	columnVisibilityModel,
	selectedCount,
	onExport,
}: ExportWizardProps) {
	const { t } = useTranslation();

	const exportColumns = useMemo(() => getExportColumns(columns), [columns]);

	// Default selection: every column currently visible in the grid.
	const defaultSelected = useMemo(
		() =>
			new Set(
				exportColumns
					.filter((col) => columnVisibilityModel[col.field] !== false)
					.map((col) => col.field),
			),
		[exportColumns, columnVisibilityModel],
	);

	const [selectedFields, setSelectedFields] =
		useState<Set<string>>(defaultSelected);
	const [scope, setScope] = useState<ExportScope>("all");
	const [format, setFormat] = useState<ExportFormat>("tsv");
	const [fileName, setFileName] = useState("");
	// Re-seed the checklist whenever the dialog is (re)opened.
	const [seededFor, setSeededFor] = useState(open);
	if (open !== seededFor) {
		setSeededFor(open);
		if (open) {
			setSelectedFields(defaultSelected);
			setScope("all");
			setFileName("");
		}
	}

	const toggleField = (field: string) => {
		setSelectedFields((prev) => {
			const next = new Set(prev);
			if (next.has(field)) {
				next.delete(field);
			} else {
				next.add(field);
			}
			return next;
		});
	};

	const allSelected = selectedFields.size === exportColumns.length;
	const noneSelected = selectedFields.size === 0;

	const handleExport = () => {
		onExport({
			mode: scope,
			format,
			fields: exportColumns
				.map((col) => col.field)
				.filter((field) => selectedFields.has(field)),
			fileName,
		});
		onClose();
	};

	return (
		<Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
			<DialogTitle variant="modalTitle">
				{t("ui.data_grid.export.wizard_title")}
			</DialogTitle>
			<DialogContent dividers>
				<FormControl component="fieldset" sx={{ width: "100%" }}>
					<Stack
						direction="row"
						sx={{ justifyContent: "space-between", alignItems: "center" }}
					>
						<FormLabel component="legend">
							{t("ui.data_grid.export.columns")}
						</FormLabel>
						<Box>
							<Button
								size="small"
								disabled={allSelected}
								onClick={() =>
									setSelectedFields(
										new Set(exportColumns.map((col) => col.field)),
									)
								}
							>
								{t("ui.data_grid.export.select_all")}
							</Button>
							<Button
								size="small"
								disabled={noneSelected}
								onClick={() => setSelectedFields(new Set())}
							>
								{t("ui.data_grid.export.clear_all")}
							</Button>
						</Box>
					</Stack>
					<Box
						sx={{
							maxHeight: 260,
							overflowY: "auto",
							display: "grid",
							gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
							mt: 1,
						}}
					>
						{exportColumns.map((col) => (
							<FormControlLabel
								key={col.field}
								control={
									<Checkbox
										size="small"
										checked={selectedFields.has(col.field)}
										onChange={() => toggleField(col.field)}
									/>
								}
								label={col.headerName}
							/>
						))}
					</Box>
				</FormControl>

				<Divider sx={{ my: 2 }} />

				<TextField
					fullWidth
					size="small"
					label={t("ui.data_grid.export.file_name")}
					placeholder={t("ui.data_grid.export.file_name_placeholder")}
					value={fileName}
					onChange={(event) => setFileName(event.target.value)}
					sx={{ mb: 2 }}
				/>

				<Stack direction={{ xs: "column", sm: "row" }} spacing={4}>
					<FormControl>
						<FormLabel>{t("ui.data_grid.export.scope")}</FormLabel>
						<RadioGroup
							value={scope}
							onChange={(event) => setScope(event.target.value as ExportScope)}
						>
							<FormControlLabel
								value="all"
								control={<Radio size="small" />}
								label={t("ui.data_grid.export.scope_all_pages")}
							/>
							<FormControlLabel
								value="selected"
								disabled={selectedCount === 0}
								control={<Radio size="small" />}
								label={t("ui.data_grid.export.scope_selected", {
									count: selectedCount,
								})}
							/>
						</RadioGroup>
					</FormControl>

					<FormControl>
						<FormLabel>{t("ui.data_grid.export.format")}</FormLabel>
						<RadioGroup
							value={format}
							onChange={(event) =>
								setFormat(event.target.value as ExportFormat)
							}
						>
							<FormControlLabel
								value="tsv"
								control={<Radio size="small" />}
								label="TSV"
							/>
							<FormControlLabel
								value="csv"
								control={<Radio size="small" />}
								label="CSV"
							/>
						</RadioGroup>
					</FormControl>
				</Stack>

				{noneSelected && (
					<Typography variant="body2" color="error" sx={{ mt: 2 }}>
						{t("ui.data_grid.export.no_columns")}
					</Typography>
				)}
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose}>{t("ui.data_grid.cancel")}</Button>
				<Button
					variant="contained"
					disabled={noneSelected}
					onClick={handleExport}
				>
					{t("ui.data_grid.export.export_button")}
				</Button>
			</DialogActions>
		</Dialog>
	);
}
