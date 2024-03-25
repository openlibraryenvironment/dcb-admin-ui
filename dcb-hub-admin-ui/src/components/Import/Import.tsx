import Upload from "@components/Upload/Upload";
import {
	Dialog,
	DialogTitle,
	IconButton,
	DialogContent,
	Stack,
} from "@mui/material";
import { useTranslation } from "next-i18next";
import { MdClose } from "react-icons/md";
import Selector from "@components/Selector/Selector";

type ImportForm = {
	show: boolean;
	onClose: any;
};

export default function Import({ show, onClose }: ImportForm) {
	const { t } = useTranslation();
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
			{/* Parameterised so we can pass in import profiles in future work - we'll just need to add in a prop */}
			<DialogTitle variant="modalTitle">
				{t("mappings.import_title", { profile: "circulation status" })}
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
					<Selector optionsType="Host LMS" />
					<Upload onCancel={handleCloseImport} />
				</Stack>
			</DialogContent>
		</Dialog>
	);
}
