import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Stack, Typography, Button, Box, Alert } from "@mui/material";
import { UploadFile, CheckCircle } from "@mui/icons-material";

import Import from "@components/Import/Import";

interface RefValueMappingStepProps {
	hostLmsCode: string;
}

export default function RefValueMappingStep({
	hostLmsCode,
}: RefValueMappingStepProps) {
	const { t } = useTranslation();
	const [showImport, setShowImport] = useState(false);
	// null = nothing imported yet; a number accumulates across repeated imports.
	const [importedCount, setImportedCount] = useState<number | null>(null);
	const hasImported = importedCount !== null;

	return (
		<Stack
			spacing={3}
			direction="column"
			sx={{ mt: 1, alignItems: "flex-start" }}
		>
			<Typography variant="h6">
				{t("nav.mappings.allReferenceValue")}
			</Typography>
			<Typography>
				{t("libraries.new.ref_mapping_explanation", { hostLms: hostLmsCode })}
			</Typography>

			{hasImported && (
				<Alert
					severity="success"
					icon={<CheckCircle fontSize="inherit" />}
					sx={{ width: "100%" }}
				>
					{t("libraries.new.ref_mapping_added", { count: importedCount ?? 0 })}
				</Alert>
			)}

			<Box
				sx={{
					p: 3,
					border: "1px dashed",
					borderColor: "divider",
					borderRadius: 1,
					width: "100%",
					textAlign: "center",
				}}
			>
				<Button
					variant={hasImported ? "outlined" : "contained"}
					startIcon={<UploadFile />}
					onClick={() => setShowImport(true)}
				>
					{hasImported ? t("mappings.import_more") : t("mappings.import")}
				</Button>
				<Typography
					variant="caption"
					sx={{
						display: "block",
						mt: 1,
						color: "text.secondary",
					}}
				>
					{t("mappings.new_library")}
				</Typography>
			</Box>
			{showImport && (
				<Import
					show={showImport}
					onClose={() => setShowImport(false)}
					type="Reference value mappings"
					presetHostLms={hostLmsCode}
					onImported={(count) =>
						setImportedCount((prev) => (prev ?? 0) + count)
					}
				/>
			)}
		</Stack>
	);
}
