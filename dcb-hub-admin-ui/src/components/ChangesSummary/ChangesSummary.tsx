import {
	TableContainer,
	Table,
	TableHead,
	TableRow,
	TableCell,
	TableBody,
} from "@mui/material";
import { useTranslation } from "next-i18next";
import { fieldNameToLabel } from "src/helpers/dataChangeLogHelperFunctions";
import RenderAttribute from "src/helpers/RenderAttribute/RenderAttribute";

type ChangesSummaryType = {
	action: string;
	changes: any;
};
// Currently handles INSERT and UPDATE: will need a bit of work to also support DELETE.

export default function ChangesSummary({
	action,
	changes,
}: ChangesSummaryType) {
	const parsedChanges = JSON.parse(changes);
	const { t } = useTranslation();

	let fields: string[] = [];
	let isUpdate = false;
	if (action === "UPDATE") {
		isUpdate = true;
		fields = Object.keys(parsedChanges.new_values);
	} else {
		fields = Object.keys(parsedChanges);
	}

	return (
		<TableContainer>
			<Table>
				<TableHead>
					<TableRow>
						<TableCell>{t("data_change_log.field_label")}</TableCell>
						<TableCell>{t("data_change_log.field_name")}</TableCell>
						<TableCell>{t("data_change_log.new_value")}</TableCell>
						{isUpdate && (
							<TableCell>{t("data_change_log.old_value")}</TableCell>
						)}
					</TableRow>
				</TableHead>
				<TableBody>
					{fields.map((field) => (
						<TableRow key={field}>
							<TableCell>{field}</TableCell>
							<TableCell>{fieldNameToLabel(field)}</TableCell>
							<TableCell>
								{isUpdate ? (
									<RenderAttribute
										attribute={parsedChanges.new_values[field]}
									/>
								) : (
									<RenderAttribute attribute={parsedChanges[field]} />
								)}
							</TableCell>
							{isUpdate && (
								<TableCell>
									<RenderAttribute
										attribute={parsedChanges.old_values[field]}
									/>
								</TableCell>
							)}
						</TableRow>
					))}
				</TableBody>
			</Table>
		</TableContainer>
	);
}
