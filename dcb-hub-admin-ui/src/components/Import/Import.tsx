import Upload from "@components/Upload/Upload";
import { Dialog, DialogTitle, IconButton, DialogContent } from "@mui/material";
import { useTranslation } from "next-i18next";
import { MdClose } from "react-icons/md";
import Selector from "@components/Selector/Selector";

type ImportForm = {
    show: boolean,
    onClose: any,
  };

export default function Import({show, onClose}: ImportForm) {
  const { t } = useTranslation();
  // Dialog for the mappings import. Features the HostLMS selector and Upload components
  return (
  <Dialog open={show} onClose={onClose} aria-labelledby="import-dialog">
    <DialogTitle style={{ textAlign: 'center'}}> {t("mappings.import_title")}</DialogTitle>
    <IconButton
        aria-label="close"
        onClick={onClose}
        sx={{
          position: 'absolute',
          right: 8,
          top: 8,
          color: (theme) => theme.palette.grey[500],
        }}
      >
        <MdClose/>
      </IconButton>
  <DialogContent>
      <Selector optionsType="HostLMS"/>
      <Upload/>
  </DialogContent>

  </Dialog>
  );
};
