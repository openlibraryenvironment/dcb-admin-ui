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
import { useTranslation } from "next-i18next";
import { MdClose } from "react-icons/md";
import Selector from "@components/Selector/Selector";
import { useState } from "react";

type ImportForm = {
	show: boolean;
	onClose: any;
};
type MappingOption = {
	displayKey: string; // Translation key for users
	category: string; // This is what gets sent to the server for validation
	type: string; // along with this to determine ref value vs numeric range
};

const MAPPING_OPTIONS: MappingOption[] = [
	{
		displayKey: "nav.mappings.allReferenceValue",
		type: "Reference value mappings",
		category: "all",
	},
	{
		displayKey: "mappings.item_type_ref_value",
		type: "Reference value mappings",
		category: "ItemType",
	},
	{
		displayKey: "mappings.location_ref_value",
		type: "Reference value mappings",
		category: "Location",
	},
	{
		displayKey: "mappings.patron_type_ref_value",
		type: "Reference value mappings",
		category: "patronType",
	},
	{
		displayKey: "nav.mappings.allNumericRange",
		type: "Numeric range mappings",
		category: "all",
	},
	{
		displayKey: "mappings.item_type_num_range",
		type: "Numeric range mappings",
		category: "ItemType",
	},
	{
		displayKey: "mappings.patron_type_num_range",
		type: "Numeric range mappings",
		category: "patronType",
	},
];

export default function Import({ show, onClose }: ImportForm) {
	const { t } = useTranslation();
	const [category, setCategory] = useState("");
	const [type, setType] = useState("");

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
					profile:
						category != ""
							? category.toLowerCase()
							: t(
									"mappings.ref_value",
									"Reference value mappings",
								).toLowerCase(),
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
				<Stack spacing={1}>
					<Autocomplete
						options={MAPPING_OPTIONS}
						getOptionLabel={(option: any) => t(option.displayKey)}
						onChange={(event, value) => {
							setCategory(value?.category ?? "all");
							setType(value?.type ?? "Reference value mappings");
						}}
						renderInput={(params) => (
							<TextField {...params} required label={t("mappings.category")} />
						)}
						groupBy={(option) => option.type}
					/>
					<Selector optionsType="Host LMS" />
					<Upload
						onCancel={handleCloseImport}
						category={category}
						type={type}
					/>
				</Stack>
			</DialogContent>
		</Dialog>
	);
}
