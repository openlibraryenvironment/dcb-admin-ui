import Upload from "@components/Upload/Upload";
import {
	Dialog,
	DialogTitle,
	Grid,
	IconButton,
	DialogContent,
	Stack,
	Autocomplete,
	TextField,
	Typography,
} from "@mui/material";
import { Trans, useTranslation } from "react-i18next";
import { Close } from "@mui/icons-material";
import Selector from "@components/Selector/Selector";
import { MAPPING_OPTIONS } from "@constants/mappingsImportConstants";
import { MappingOption } from "@models/MappingOption";
import useCode from "@hooks/useCode";
import RenderAttribute from "@components/RenderAttribute/RenderAttribute";
import { useEffect } from "react";

type ImportForm = {
	show: boolean;
	onClose: any;
	type: "Reference value mappings" | "Numeric range mappings" | "Locations";
	presetHostLms?: string;
	presetHostLmsId?: string;
	libraryName?: string;
	onImported?: (count: number) => void;
};
// This could be generic for locations. Upload maybe not.

export default function Import({
	show,
	onClose,
	type,
	presetHostLms,
	presetHostLmsId,
	libraryName,
	onImported,
}: ImportForm) {
	const { t } = useTranslation();

	const { category, updateCategory, resetAll, updateCode } = useCode();

	// Sync the presetHostLms to the global code state so Upload.tsx can read it
	useEffect(() => {
		if (presetHostLms && updateCode) {
			updateCode(presetHostLms);
		}
	}, [presetHostLms, updateCode]);

	const handleCloseImport = () => {
		resetAll(); // Reset both code and category when closing the import dialog
		onClose();
	};

	// This method closes the import modal and is passed to Upload as a callback, so that Upload's cancel button can close the whole Import window.
	// This means that the Cancel button in 'Upload' can be used to close this Import modal.
	// Same principle can be used in other components - a callback can be passed to the child to affect behaviour in the parent.
	// Dialog for the mappings import. Features the HostLMS selector and Upload components
	return (
		<Dialog
			open={show}
			onClose={handleCloseImport}
			aria-labelledby="import-dialog"
			fullWidth
			maxWidth={"sm"}
		>
			<DialogTitle variant="modalTitle">
				{t("mappings.import_title", {
					profile: type.toLowerCase(),
				})}
			</DialogTitle>
			<IconButton
				aria-label="close"
				onClick={handleCloseImport}
				sx={{
					position: "absolute",
					right: 8,
					top: 8,
					color: (theme) => theme.palette.grey[500],
				}}
			>
				<Close />
			</IconButton>
			<DialogContent>
				<Stack spacing={2}>
					<Trans
						i18nKey={"mappings.import_body"}
						t={t}
						components={{
							paragraph: <p />,
						}}
					/>

					{/* 1. Dynamic Read-Only Grid: Shows if we have a preset Host LMS OR if it's Locations */}
					{(presetHostLms || type === "Locations") && (
						<Grid container columns={{ xs: 4, sm: 8, md: 12 }}>
							{/* Only lock the Category to read-only if it's Locations */}
							{type === "Locations" && (
								<Grid size={{ xs: 2, sm: 4, md: 6 }}>
									<Stack>
										<Typography variant="attributeTitle">
											{t("mappings.category")}
										</Typography>
										<RenderAttribute attribute={type} />
									</Stack>
								</Grid>
							)}

							{/* Show the preset Host LMS as read-only if one was passed in */}
							{presetHostLms && (
								<Grid size={{ xs: 2, sm: 4, md: 6 }}>
									<Stack>
										<Typography variant="attributeTitle">
											{t("hostlms.hostlms_one")}
										</Typography>
										<RenderAttribute attribute={presetHostLms} />
									</Stack>
								</Grid>
							)}
						</Grid>
					)}

					{/* Category Autocomplete: ALWAYS show for Mappings, NEVER for Locations */}
					{type !== "Locations" && (
						<Autocomplete
							options={MAPPING_OPTIONS[type]}
							getOptionLabel={(option: MappingOption) => t(option.displayKey)}
							onChange={(event, value) => {
								updateCategory(value?.category ?? "");
							}}
							renderInput={(params) => (
								<TextField
									{...params}
									required
									label={t("mappings.category")}
								/>
							)}
						/>
					)}

					{/* Host LMS Selector: ONLY show if a preset wasn't passed down */}
					{!presetHostLms && (
						<Selector optionsType={t("hostlms.hostlms_one")} />
					)}

					<Upload
						onCancel={handleCloseImport}
						category={category}
						type={type}
						presetHostLmsId={presetHostLmsId}
						libraryName={libraryName}
						onImported={onImported}
					/>
				</Stack>
			</DialogContent>
		</Dialog>
	);
}
