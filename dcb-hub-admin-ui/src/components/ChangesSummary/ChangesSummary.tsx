import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
	TableContainer,
	Table,
	TableHead,
	TableRow,
	TableCell,
	TableBody,
	Typography,
} from "@mui/material";
import { isEmpty } from "lodash";
import {
	fieldNameToLabel,
	gridFieldNameToLabel,
} from "@helpers/dataChangeLogHelperFunctions";
import RenderAttribute from "@components/RenderAttribute/RenderAttribute";

type ChangesSummaryType = {
	action: "INSERT" | "UPDATE" | "DELETE";
	changes: string | Record<string, any>;
	context: "dataChangeLog" | "gridEdit";
};

const META_FIELDS = [
	"reason",
	"change_category",
	"change_reference_url",
	"last_edited_by",
];

export default function ChangesSummary({
	action,
	changes,
	context,
}: ChangesSummaryType) {
	const { t } = useTranslation();

	const isUpdate = action === "UPDATE";
	const isInsert = action === "INSERT";
	const isDelete = action === "DELETE";

	const { parsedChanges, fields } = useMemo(() => {
		const parsed = typeof changes === "string" ? JSON.parse(changes) : changes;
		let calculatedFields: string[] = [];

		if (isUpdate && parsed?.old_values && parsed?.new_values) {
			const oldFields = Object.keys(parsed.old_values);
			const newFields = Object.keys(parsed.new_values);
			calculatedFields = Array.from(new Set([...oldFields, ...newFields]));
		} else {
			calculatedFields = Object.keys(parsed || {});
		}

		return {
			parsedChanges: parsed,
			fields: calculatedFields.filter((field) => !META_FIELDS.includes(field)),
		};
	}, [changes, isUpdate]);

	if (isEmpty(fields)) {
		return (
			<Typography variant="body1">
				{t("data_change_log.no_eligible_changes")}
			</Typography>
		);
	}

	return (
		<TableContainer>
			<Table aria-label={t("data_change_log.summary_table_aria")}>
				<TableHead>
					<TableRow>
						<TableCell component="th" scope="col">
							{t("data_change_log.field_label")}
						</TableCell>
						{isUpdate && (
							<TableCell component="th" scope="col">
								{t("data_change_log.old_value")}
							</TableCell>
						)}
						{isDelete && (
							<TableCell component="th" scope="col">
								{t("data_change_log.deleted_value")}
							</TableCell>
						)}
						{!isDelete && (
							<TableCell component="th" scope="col">
								{t("data_change_log.new_value")}
							</TableCell>
						)}
					</TableRow>
				</TableHead>
				<TableBody>
					{fields.map((field) => (
						<TableRow
							key={field}
							sx={{ "&:last-child td, &:last-child th": { borderBottom: 0 } }}
						>
							<TableCell component="th" scope="row">
								{context === "dataChangeLog"
									? fieldNameToLabel(field)
									: gridFieldNameToLabel(field)}
							</TableCell>

							{isUpdate && (
								<TableCell>
									<RenderAttribute
										attribute={parsedChanges.old_values?.[field]}
									/>
								</TableCell>
							)}

							{isInsert && (
								<TableCell>
									<RenderAttribute attribute={parsedChanges[field]} />
								</TableCell>
							)}

							{isUpdate && (
								<TableCell>
									<RenderAttribute
										attribute={parsedChanges.new_values?.[field]}
									/>
								</TableCell>
							)}

							{isDelete && (
								<TableCell>
									<RenderAttribute attribute={parsedChanges[field]} />
								</TableCell>
							)}
						</TableRow>
					))}
				</TableBody>
			</Table>
		</TableContainer>
	);
}
