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
import { useTranslation } from "next-i18next";
import {
	fieldNameToLabel,
	gridFieldNameToLabel,
} from "src/helpers/dataChangeLogHelperFunctions";
import RenderAttribute from "src/helpers/RenderAttribute/RenderAttribute";

type ChangesSummaryType = {
	action: string;
	changes: any;
	context: string; // Whether it's called for the change log or for an edit
};

export default function ChangesSummary({
	action,
	changes,
	context,
}: ChangesSummaryType) {
	const parsedChanges = JSON.parse(changes);
	const { t } = useTranslation();

	let fields: string[] = [];
	const isUpdate = action === "UPDATE";
	const isInsert = action === "INSERT";

	const isDelete = action === "DELETE";

	// We can have an INSERT, an UPDATE, or a DELETE
	// Edits should always be UPDATES
	// DCL can be either

	if (isUpdate) {
		const oldFields = Object.keys(parsedChanges.old_values);
		const newFields = Object.keys(parsedChanges.new_values);
		fields = oldFields.concat(
			newFields.filter((field) => !oldFields.includes(field)),
		);
	} else {
		// Delete and Insert don't have new/old values so we get fields from parsed changes.
		fields = Object.keys(parsedChanges);
	}

	const metaFields = [
		"reason",
		"change_category",
		"change_reference_url",
		"last_edited_by", // These fields are change specific and should not be shown in relation to previous changes
	];

	fields = fields.filter((field) => !metaFields.includes(field)); // Remove meta fields from the summary

	return !isEmpty(fields) ? (
		<TableContainer>
			<Table>
				<TableHead>
					<TableRow>
						<TableCell>{t("data_change_log.field_label")}</TableCell>
						{isUpdate && (
							<TableCell>{t("data_change_log.old_value")}</TableCell>
						)}
						{isDelete && (
							<TableCell>{t("data_change_log.deleted_value")}</TableCell>
						)}

						{!isDelete && (
							<TableCell>{t("data_change_log.new_value")}</TableCell>
						)}
					</TableRow>
				</TableHead>
				<TableBody>
					{fields.map((field) => (
						<TableRow
							key={field}
							sx={{
								"&:last-child td, &:last-child th": { borderBottom: 0 },
							}}
						>
							<TableCell>
								{context == "dataChangeLog"
									? fieldNameToLabel(field)
									: gridFieldNameToLabel(field)}
							</TableCell>
							{isUpdate && (
								<TableCell>
									<RenderAttribute
										attribute={parsedChanges.old_values[field]}
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
										attribute={parsedChanges.new_values[field]}
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
	) : (
		<Typography variant="body1">
			{t("data_change_log.no_eligible_changes")}
		</Typography>
	);
}
