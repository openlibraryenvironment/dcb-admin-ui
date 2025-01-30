import Upload from "@components/Upload/Upload";
import {
	Dialog,
	DialogTitle,
	IconButton,
	DialogContent,
	Stack,
	Autocomplete,
	TextField,
	Typography,
} from "@mui/material";
import { Trans, useTranslation } from "next-i18next";
import { MdClose } from "react-icons/md";
import Selector from "@components/Selector/Selector";
import { MAPPING_OPTIONS } from "src/constants/mappingsImportConstants";
import { MappingOption } from "@models/MappingOption";
import useCode from "@hooks/useCode";
import RenderAttribute from "@components/RenderAttribute/RenderAttribute";
import Grid from "@mui/material/Unstable_Grid2";

type ImportForm = {
	show: boolean;
	onClose: any;
	type: "Reference value mappings" | "Numeric range mappings" | "Locations";
	presetHostLms?: string;
	presetHostLmsId?: string;
	libraryName?: string;
};
// This could be generic for locations. Upload maybe not.

export default function Import({
	show,
	onClose,
	type,
	presetHostLms,
	presetHostLmsId,
	libraryName,
}: ImportForm) {
	const { t } = useTranslation();
	const { category, updateCategory, resetAll } = useCode();

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
				<MdClose />
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

					{type == "Locations" && presetHostLms ? (
						<Grid
							container
							// spacing={{ xs: 2, sm: 3, md: 3, lg: 3 }}
							columns={{ xs: 3, sm: 6, md: 9, lg: 12 }}
						>
							<Grid xs={2} sm={4} md={6}>
								<Stack>
									<Typography variant="attributeTitle">
										{t("mappings.category")}
									</Typography>
									<RenderAttribute attribute={type} />
								</Stack>
							</Grid>
							<Grid xs={2} sm={4} md={4}>
								<Stack>
									<Typography variant="attributeTitle">
										{t("hostlms.hostlms_one")}
									</Typography>
									<RenderAttribute attribute={presetHostLms} />
								</Stack>
							</Grid>
						</Grid>
					) : (
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
					{type != "Locations" && !presetHostLms ? (
						<Selector optionsType={t("hostlms.hostlms_one")} />
					) : null}
					<Upload
						onCancel={handleCloseImport}
						category={category}
						type={type}
						presetHostLmsId={presetHostLmsId}
						libraryName={libraryName}
					/>
				</Stack>
			</DialogContent>
		</Dialog>
	);
}
