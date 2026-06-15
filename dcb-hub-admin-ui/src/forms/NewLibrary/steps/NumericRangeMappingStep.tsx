import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Stack, Typography, Button, Box } from "@mui/material";
import { UploadFile } from "@mui/icons-material";

import Import from "@components/Import/Import";

interface NumericMappingStepProps {
	hostLmsCode: string;
}

export default function NumericMappingStep({
	hostLmsCode,
}: NumericMappingStepProps) {
	const { t } = useTranslation();
	const [showImport, setShowImport] = useState(false);

	return (
		<Stack
			spacing={3}
			direction="column"
			sx={{ mt: 1, alignItems: "flex-start" }}
		>
			<Typography variant="h6">
				{t("libraries.config.data.mappings.all_num_range", {
					hostLms: hostLmsCode,
				})}
			</Typography>
			<Typography>
				{t("libraries.new.num_mapping_explanation", { hostLms: hostLmsCode })}
			</Typography>

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
					variant="contained"
					startIcon={<UploadFile />}
					onClick={() => setShowImport(true)}
				>
					{t("mappings.import.button")}
				</Button>
				<Typography
					variant="caption"
					display="block"
					sx={{ mt: 1, color: "text.secondary" }}
				>
					{t("mappings.import.num_helper_text")}
				</Typography>
			</Box>

			{showImport && (
				<Import
					show={showImport}
					onClose={() => setShowImport(false)}
					type="Numeric range mappings"
					presetHostLms={hostLmsCode}
				/>
			)}
		</Stack>
	);
}
