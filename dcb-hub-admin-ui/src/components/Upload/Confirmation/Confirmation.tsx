// A modal to confirm or cancel file uploads. Originally built for Circulation status mappings.
import Alert from '@components/Alert/Alert';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, useTheme } from '@mui/material';
import { useTranslation, Trans } from 'next-i18next';

type ConfirmType = {
    open: boolean,
    onClose: any,
    onConfirm: any,
    existingMappingCount: number,
    code: string,
    fileName: string,
};

const Confirmation = ({ open, onClose, onConfirm, code, existingMappingCount, fileName }: ConfirmType) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const deleted = "deleted";
  return (
    <Dialog open={open} onClose={onClose} aria-labelledby='replace-mappings-confirmation-modal'>
        {/* // Enforcing the style of bold, centered modal or dialog headers */}
      <DialogTitle style={{ textAlign: 'center'}}><strong>{t("mappings.confirmation_header")}</strong></DialogTitle>
      <DialogContent>
            <Trans
              i18nKey="mappings.confirmation_body" 
              values={{ existingMappingCount, code, fileName, deleted }} 
              components={{paragraph: <p/> , bold: <strong/>}}/>           
            <Alert severityType="warning" alertText = {t("mappings.confirmation_warning")} textColor={theme.palette.common.black}/>
            {t("mappings.confirmation_replace")}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined" color="primary">
            {t("mappings.cancel")}
        </Button>
        {/* This makes the Cancel and Replace Mappings buttons left and right aligned, respectively*/}
        <div style={{flex: '1 0 0'}} />
        <Button onClick={onConfirm} color="primary" variant="contained" autoFocus>
            {t("mappings.confirmation_replace_mappings")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
export default Confirmation;
