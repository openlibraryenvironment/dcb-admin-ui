import { useTranslation } from "react-i18next";
import { Tooltip } from "@mui/material";
import { ImageOutlined, PrintOutlined } from "@mui/icons-material";
import { Toolbar, ToolbarButton } from "@mui/x-charts/Toolbar";
import {
	ChartsToolbarImageExportTrigger,
	ChartsToolbarPrintExportTrigger,
} from "@mui/x-charts-pro";

/**
 * The picture, for a slide.
 *
 * MUI X Premium ships image and print export triggers that nothing in this application
 * used; this mounts those two and NOT `ChartsToolbarPro`, which also renders zoom controls.
 * Those matter: none of these charts is zoomable, so the buttons do nothing, and the stock
 * toolbar renders their labels on a `span` - `aria-label` is prohibited on a span with no
 * role, which is WCAG 4.1.2 and was caught by Lighthouse.
 *
 * Each trigger is given its own name, because the icon is the only other thing in it.
 */
export default function ChartExportToolbar() {
	const { t } = useTranslation();

	const image = t("insights.export.image");
	const print = t("insights.export.print");

	return (
		<Toolbar>
			<Tooltip title={image}>
				<ChartsToolbarImageExportTrigger
					render={<ToolbarButton aria-label={image} />}
					options={{ type: "image/png" }}
				>
					<ImageOutlined fontSize="small" />
				</ChartsToolbarImageExportTrigger>
			</Tooltip>
			<Tooltip title={print}>
				<ChartsToolbarPrintExportTrigger
					render={<ToolbarButton aria-label={print} />}
				>
					<PrintOutlined fontSize="small" />
				</ChartsToolbarPrintExportTrigger>
			</Tooltip>
		</Toolbar>
	);
}
