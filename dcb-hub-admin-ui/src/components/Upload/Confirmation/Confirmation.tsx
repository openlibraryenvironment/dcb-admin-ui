// A modal to confirm or cancel file uploads. Originally built for Circulation status mappings.
import Alert from '@components/Alert/Alert';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
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
  // Trans component: https://react.i18next.com/latest/trans-component (next-i18next is built on react-i18next hence the use of its docs)
  // in theory you can also do it this way https://react.i18next.com/latest/trans-component#alternative-usage-which-lists-the-components-v11.6.0 
  // check spacings between the components
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
            <Alert severityType="warning" alertText = {t("mappings.confirmation_warning")}/>
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
