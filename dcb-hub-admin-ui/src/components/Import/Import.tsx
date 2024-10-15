import Upload from "@components/Upload/Upload";
import {
	Dialog,
	DialogTitle,
	IconButton,
	DialogContent,
	Stack,
	Autocomplete,
	TextField,
} from "@mui/material";
import { Trans, useTranslation } from "next-i18next";
import { MdClose } from "react-icons/md";
import Selector from "@components/Selector/Selector";
import { useState } from "react";
import { MAPPING_OPTIONS } from "src/constants/mappingsImportConstants";
import { MappingOption } from "@models/MappingOption";

type ImportForm = {
	show: boolean;
	onClose: any;
	mappingType: "Reference value mappings" | "Numeric range mappings";
};

export default function Import({ show, onClose, mappingType }: ImportForm) {
	const { t } = useTranslation();
	const [category, setCategory] = useState("");

	const handleCloseImport = () => {
		onClose();
	};
	// This method closes the import modal and is passed to Upload as a callback, so that Upload's cancel button can close the whole Import window.
	// This means that the Cancel button in 'Upload' can be used to close this Import modal.
	// Same principle can be used in other components - a callback can be passed to the child to affect behaviour in the parent.
	// Dialog for the mappings import. Features the HostLMS selector and Upload components
	return (
		<Dialog
			open={show}
			onClose={onClose}
			aria-labelledby="import-dialog"
			fullWidth
			maxWidth={"sm"}
		>
			<DialogTitle variant="modalTitle">
				{t("mappings.import_title", {
					profile: mappingType.toLowerCase(),
				})}
			</DialogTitle>
			<IconButton
				aria-label="close"
				onClick={onClose}
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
					<Autocomplete
						options={MAPPING_OPTIONS[mappingType]}
						getOptionLabel={(option: MappingOption) => t(option.displayKey)}
						onChange={(event, value) => {
							setCategory(value?.category ?? "all");
						}}
						renderInput={(params) => (
							<TextField {...params} required label={t("mappings.category")} />
						)}
					/>
					<Selector optionsType={t("hostlms.hostlms_one")} />
					<Upload
						onCancel={handleCloseImport}
						category={category}
						type={mappingType}
					/>
				</Stack>
			</DialogContent>
		</Dialog>
	);
}
