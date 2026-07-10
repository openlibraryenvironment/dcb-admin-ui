import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useFormContext } from "react-hook-form";
import { Stack, Typography, Button, Box, Alert } from "@mui/material";
import { UploadFile, AddLocationAlt, CheckCircle } from "@mui/icons-material";

import Import from "@components/Import/Import";
import NewLocation from "@forms/NewLocation/NewLocation";
import { getILS } from "@helpers/getILS";

interface LocationsStepProps {
	hostLmsCode: string;
	agencyCode: string;
}

export default function LocationsStep({
	hostLmsCode,
	agencyCode,
}: LocationsStepProps) {
	const { t } = useTranslation();
	const { getValues } = useFormContext();

	const [showImport, setShowImport] = useState(false);
	const [showNewLocation, setShowNewLocation] = useState(false);
	// Combined count of bulk-imported + manually-added locations. null until the
	// user adds their first one.
	const [addedCount, setAddedCount] = useState<number | null>(null);
	const hasAdded = addedCount !== null;

	// Retrieve values safely from the wizard's state machine context
	const libraryName = getValues("fullName");
	const lmsClientClass = getValues("lmsClientClass");

	return (
		<Stack
			spacing={3}
			direction="column"
			sx={{ mt: 1, alignItems: "flex-start" }}
		>
			<Typography variant="h6">{t("nav.locations")}</Typography>
			<Typography>
				{t("libraries.new.locations_explanation", { library: libraryName })}
			</Typography>

			{hasAdded && (
				<Alert
					severity="success"
					icon={<CheckCircle fontSize="inherit" />}
					sx={{ width: "100%" }}
				>
					{t("libraries.new.location_added", { count: addedCount ?? 0 })}
				</Alert>
			)}

			<Stack direction="row" spacing={3} sx={{ width: "100%", mt: 2 }}>
				{/* Bulk Import Option */}
				<Box
					sx={{
						p: 4,
						border: "1px dashed",
						borderColor: "divider",
						borderRadius: 2,
						flex: 1,
						textAlign: "center",
						display: "flex",
						flexDirection: "column",
						justifyContent: "center",
						alignItems: "center",
					}}
				>
					<Button
						variant="contained"
						size="large"
						startIcon={<UploadFile />}
						onClick={() => setShowImport(true)}
						sx={{ mb: 2 }}
					>
						{t("locations.import.button")}
					</Button>
					<Typography
						variant="caption"
						sx={{
							display: "block",
							color: "text.secondary",
						}}
					>
						{t(
							"locations.import.helper_text",
							"Upload a CSV to batch import multiple locations at once.",
						)}
					</Typography>
				</Box>

				{/* Single Manual Addition Option */}
				<Box
					sx={{
						p: 4,
						border: "1px dashed",
						borderColor: "divider",
						borderRadius: 2,
						flex: 1,
						textAlign: "center",
						display: "flex",
						flexDirection: "column",
						justifyContent: "center",
						alignItems: "center",
					}}
				>
					<Button
						variant="outlined"
						size="large"
						startIcon={<AddLocationAlt />}
						onClick={() => setShowNewLocation(true)}
						sx={{ mb: 2 }}
					>
						{t("locations.new.button")}
					</Button>
					<Typography
						variant="caption"
						sx={{
							display: "block",
							color: "text.secondary",
						}}
					>
						{t(
							"locations.new.helper_text",
							"Manually add a single pickup location to the system.",
						)}
					</Typography>
				</Box>
			</Stack>
			{/* Render the Modals */}
			{showImport && (
				<Import
					show={showImport}
					onClose={() => setShowImport(false)}
					type="Locations"
					presetHostLms={hostLmsCode}
					libraryName={libraryName}
					onImported={(count) => setAddedCount((prev) => (prev ?? 0) + count)}
				/>
			)}
			{showNewLocation && (
				<NewLocation
					show={showNewLocation}
					onClose={() => setShowNewLocation(false)}
					hostLmsCode={hostLmsCode}
					agencyCode={agencyCode}
					libraryName={libraryName}
					type="Pickup"
					ils={getILS(lmsClientClass) || ""}
					onCreated={() => setAddedCount((prev) => (prev ?? 0) + 1)}
				/>
			)}
		</Stack>
	);
}
