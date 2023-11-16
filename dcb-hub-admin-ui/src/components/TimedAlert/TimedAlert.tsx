import { Alert as MUIAlert, AlertTitle, AlertProps, Snackbar} from '@mui/material';
import { capitalize } from '@mui/material/utils';
import { forwardRef, useState} from 'react';


// Fix autohide behaviour

const SnackbarAlert = forwardRef<HTMLDivElement, AlertProps>(function Alert(
    props,
    ref,
  ) {
    return <MUIAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

export default function TimedAlert(props: any) {
    const [open, setOpen] = useState(false);
  
    const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
      if (reason === 'clickaway') {
        return;
      }
  
      setOpen(false);
    };
    return(
        <>
            <Snackbar open={props.open} autoHideDuration={props.autoHideDuration} onClose={handleClose}>
            <SnackbarAlert severity={props.severityType} onClose={props.onCloseFunc}>
                <AlertTitle>{capitalize(props.severityType)}</AlertTitle>
                {props.alertText}
            </SnackbarAlert>
            </Snackbar>
        </>
    )
}