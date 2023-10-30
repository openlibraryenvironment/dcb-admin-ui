import Upload from "@components/Upload/Upload";
import { Dialog, DialogTitle, IconButton, DialogContent, Stack } from "@mui/material";
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
  <Dialog open={show} onClose={onClose} aria-labelledby="import-dialog" fullWidth maxWidth={"sm"}>
    {/* Parameterised so we can pass in import profiles in future work - we'll just need to add in a prop */}
    <DialogTitle style={{ textAlign: 'center'}}>{t("mappings.import_title", {profile: "circulation status"})}</DialogTitle>
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
      <Stack spacing={1}>
        <Selector optionsType="Host LMS"/>
        <Upload/>
      </Stack>
  </DialogContent>

  </Dialog>
  );
};
