import * as React from 'react';
import { Alert as MUIAlert, AlertTitle} from '@mui/material';

export default function Alert(props: any) {
    return(
        <>
            <MUIAlert severity={props.severityType} onClose={props.onCloseFunc}>
                <AlertTitle>{props.severityType}</AlertTitle>
                {props.alertText}
            </MUIAlert>
        </>
    )
}