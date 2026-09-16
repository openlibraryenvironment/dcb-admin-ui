import { useTranslation } from "react-i18next";
import { IconButton, Tooltip } from "@mui/material";
import { FileDownloadOutlined } from "@mui/icons-material";

import {
	CsvColumn,
	csvFileName,
	downloadCsv,
	panelCsv,
} from "@helpers/panelCsv";
import { useExportContext } from "@helpers/insightsExport";

/**
 * The numbers on this panel, as a file.
 *
 * Not a second export engine: the rows are already in the query cache and already bounded
 * by the query's own limit, so this costs no request and cannot grow with the corpus. The
 * requests BEHIND a figure are exported by the grid a drill-down leads to, which already
 * pages a whole result set - see docs/large-exports.md.
 */
export default function PanelExport<T>({
	rows,
	columns,
	panel,
	method,
}: {
	rows: T[];
	columns: CsvColumn<T>[];
	panel: string;
	/** The registry's "how", so the file says what the figures are. */
	method?: string;
}) {
	const { t } = useTranslation();
	const context = useExportContext();

	// Nothing to export, or no statement of what it would cover - a file that named a
	// scope nobody set would be worse than no file.
	if (rows.length === 0 || !context) return null;

	const label = t("insights.export.csv", { panel });

	return (
		<Tooltip title={label}>
			<IconButton
				size="small"
				// Named for the panel, not "Download": a reader listing this page's
				// controls would otherwise hear the same word beside every figure.
				aria-label={label}
				onClick={() => {
					const generated = new Date();

					downloadCsv(
						csvFileName(panel, generated),
						panelCsv(rows, columns, {
							panel,
							scope: context.scope,
							window: context.window,
							method,
							generated,
						}),
					);
				}}
			>
				<FileDownloadOutlined fontSize="small" />
			</IconButton>
		</Tooltip>
	);
}
