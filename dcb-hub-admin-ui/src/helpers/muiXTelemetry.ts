import { muiXTelemetrySettings } from "@mui/x-license";

/**
 * MUI X's development build posts every licence check, with the key and a browser
 * fingerprint, to x-telemetry.mui.com unless told not to. Production compiles the sender
 * out, so this does nothing there and the call is dropped from the build.
 */
export const keepMuiXTelemetryOff = (): void => {
	if (import.meta.env.DEV) muiXTelemetrySettings.disableTelemetry();
};
