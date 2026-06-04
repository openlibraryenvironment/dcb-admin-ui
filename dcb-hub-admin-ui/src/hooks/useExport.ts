import { RefObject, useState } from "react";
import request from "graphql-request";
import {
	GridApiPremium,
	gridVisibleColumnFieldsSelector,
} from "@mui/x-data-grid-premium";
import { getFileNameForExport } from "@helpers/dataGrid/getFileNameForExport";
import { convertFileToString } from "@helpers/dataGrid/convertFileToString";
import { processGridFilterModel } from "@helpers/dataGrid/utilities";

interface UseExportProps {
	apiRef: RefObject<GridApiPremium | null>;
	dcbApiBase: string;
	headers: Record<string, string>;
	baseQuery: string;
	exportQuery: any; // GraphQL Codegen DocumentNode
	filterModel: any;
	sortModel: any;
	onExportSuccess: (message: string, count: number) => void;
	onExportError: (message: string) => void;
	type: string;
	coreType: string; // e.g., "libraries", "locations"
}

export const useExport = ({
	apiRef,
	dcbApiBase,
	headers,
	baseQuery,
	exportQuery,
	filterModel,
	sortModel,
	onExportSuccess,
	onExportError,
	type,
	coreType,
}: UseExportProps) => {
	const [exportProgress, setExportProgress] = useState({
		isExporting: false,
		progress: 0,
		totalRecords: 0,
	});

	const fetchAllExportData = async (exportMode: string) => {
		if (!apiRef?.current) return [];
		setExportProgress({ isExporting: true, progress: 0, totalRecords: 0 });
		const pageSize = 1000;
		let allContent: any[] = [];

		const exportQueryString =
			exportMode === "filtered"
				? (processGridFilterModel(filterModel, baseQuery, [
						"status",
						"description",
					]) ?? "")
				: baseQuery;

		const queryVariables = {
			query: exportQueryString,
			pagesize: pageSize,
			pageno: 0,
			order: sortModel[0]?.field ?? "id",
			orderBy: sortModel[0]?.sort?.toUpperCase() ?? "ASC",
		};

		try {
			const initialData = await request<any>(
				`${dcbApiBase}/graphql`,
				exportQuery,
				queryVariables,
				headers,
			);

			const totalSize = initialData?.[coreType]?.totalSize || 0;
			const totalPages = Math.ceil(totalSize / pageSize);
			allContent = initialData?.[coreType]?.content || [];

			setExportProgress((prev) => ({
				...prev,
				totalRecords: totalSize,
				progress: Math.round((allContent.length / totalSize) * 100),
			}));

			for (let page = 1; page < totalPages; page++) {
				const nextPageData = await request<any>(
					`${dcbApiBase}/graphql`,
					exportQuery,
					{ ...queryVariables, pageno: page },
					headers,
				);

				if (nextPageData?.[coreType]?.content) {
					allContent = [...allContent, ...nextPageData[coreType].content];
					setExportProgress((prev) => ({
						...prev,
						progress: Math.round((allContent.length / totalSize) * 100),
					}));
				}
			}
		} catch (error) {
			console.error("Failed to fetch all data for export", error);
			throw error;
		}

		return allContent;
	};

	const handleExport = async (fileType: string, exportMode: string) => {
		if (!apiRef?.current) return;

		if (exportMode === "current") {
			apiRef.current.exportDataAsCsv();
			return;
		}
		if (exportMode === "print") {
			apiRef.current.exportDataAsPrint();
			return;
		}

		try {
			const allContent = await fetchAllExportData(exportMode);
			const delimiter = fileType === "csv" ? "," : "\t";
			const fileName = `${getFileNameForExport(type, filterModel)}.${fileType}`;

			const visibleColumns = gridVisibleColumnFieldsSelector(apiRef);
			const usefulColumns =
				exportMode === "all" || exportMode === "default"
					? null
					: visibleColumns.filter(
							(value) =>
								value !== "__detail_panel_toggle__" && value !== "__check__",
						);

			const dataString = convertFileToString(
				allContent,
				delimiter,
				coreType,
				usefulColumns,
			);

			const blob = new Blob([dataString], {
				type: `text/${fileType};charset=utf-8;`,
			});
			const link = document.createElement("a");
			if (link.download !== undefined) {
				const url = URL.createObjectURL(blob);
				link.setAttribute("href", url);
				link.setAttribute("download", fileName);
				link.style.visibility = "hidden";
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);

				onExportSuccess(
					`Successfully exported ${allContent.length} records.`,
					allContent.length,
				);
			}
		} catch (error) {
			console.error(error);
			onExportError("Failed to export records.");
		} finally {
			setExportProgress({ isExporting: false, progress: 0, totalRecords: 0 });
		}
	};

	return { exportProgress, handleExport };
};
