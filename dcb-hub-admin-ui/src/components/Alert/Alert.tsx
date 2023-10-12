import * as React from 'react';
import { Alert as MUIAlert, AlertTitle} from '@mui/material';
import { capitalize } from '@mui/material/utils';

export default function Alert(props: any) {
    return(
        <>
            <MUIAlert severity={props.severityType} onClose={props.onCloseFunc}>
                <AlertTitle>{capitalize(props.severityType)}</AlertTitle>
                {props.alertText}
            </MUIAlert>
        </>
    )
}