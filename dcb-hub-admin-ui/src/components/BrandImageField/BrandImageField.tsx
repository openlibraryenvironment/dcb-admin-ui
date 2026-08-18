import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useDcbRestClient } from "@hooks/useDcbRestClient";
import {
	BRAND_IMAGE_ACCEPT,
	BRAND_IMAGE_MAX_BYTES,
} from "@constants/discoveryBranding";

type Props = {
	/** The stored value. Whichever control produced it, it is one column. */
	value: string;
	onChange: (value: string) => void;
	label: string;
	helperText: string;
	error?: boolean;
	disabled?: boolean;
};

/**
 * One brand image, two ways to supply it — R-17e.
 *
 * <h2>Neither control is the fallback for the other</h2>
 *
 * A consortium with a brand team and a CDN must not be made to re-upload into our bucket.
 * A consortium with neither must not be told to go and find hosting before it can have a
 * logo. So both controls are here and they write to the same field, because the column
 * stores a URL either way.
 *
 * Upload is presented first because it is the better default, and the help text says why
 * rather than leaving it implied: an external URL means every patron's browser fetches an
 * image from a host we do not control. Their outage unbrands us, and their logs get the
 * patron's IP and our referrer. That is a real cost and an administrator choosing between
 * two controls deserves to know it, in the form, not in a design document nobody reads.
 *
 * <h2>The accepted formats are stated BEFORE the file picker</h2>
 *
 * PNG or JPEG, said next to the button rather than discovered from a rejected upload. SVG
 * is refused because it is a script-capable document and one served from our origin would
 * be stored XSS in the chrome of every patron page; WebP is refused because it cannot be
 * re-encoded server-side, and an image we cannot decode is one we will not store.
 *
 * The size check here is a courtesy, not a control. dcb-service sniffs magic bytes,
 * enforces its own byte and dimension caps from the image header before any decode, and
 * re-encodes what it stores. Nothing a browser does is evidence about the bytes.
 */
export function BrandImageField({
	value,
	onChange,
	label,
	helperText,
	error,
	disabled,
}: Props) {
	const { t } = useTranslation();
	const client = useDcbRestClient();
	const fileInput = useRef<HTMLInputElement>(null);

	const [uploading, setUploading] = useState(false);
	const [uploadError, setUploadError] = useState<string | null>(null);

	const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		// Reset immediately, so choosing the same file twice after a failure still
		// fires a change event.
		event.target.value = "";
		if (!file) {
			return;
		}

		if (file.size > BRAND_IMAGE_MAX_BYTES) {
			setUploadError(t("consortium.brand.upload_too_large"));
			return;
		}

		setUploading(true);
		setUploadError(null);

		const form = new FormData();
		form.append("file", file);

		try {
			const response = await client.post("/brand-assets", form);
			onChange(response.data.url);
		} catch (uploadFailure: any) {
			// dcb-service's refusals are written for a person — "the file is not a PNG or
			// a JPEG", "the image is 6000x4000; the limit is 4096 pixels on either edge".
			// Show that rather than a status code: the whole point of validating on the
			// server is undone if the administrator is told only that it failed.
			setUploadError(
				uploadFailure?.response?.data?.message ??
					t("consortium.brand.upload_failed"),
			);
		} finally {
			setUploading(false);
		}
	};

	return (
		<Stack direction="column" spacing={1}>
			<Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
				<Button
					variant="outlined"
					size="small"
					disabled={disabled || uploading}
					onClick={() => fileInput.current?.click()}
					startIcon={
						uploading ? <CircularProgress size={16} thickness={5} /> : undefined
					}
				>
					{uploading
						? t("consortium.brand.uploading")
						: t("consortium.brand.upload")}
				</Button>
				<Typography variant="body2" color="text.secondary">
					{t("consortium.brand.upload_formats")}
				</Typography>
			</Stack>

			{/* Visually hidden rather than display:none — a hidden input is still the
			    labelled control the button proxies for, and display:none takes it out of
			    the accessibility tree entirely. */}
			<Box
				component="input"
				ref={fileInput}
				type="file"
				accept={BRAND_IMAGE_ACCEPT}
				onChange={handleFile}
				aria-label={label}
				sx={{
					position: "absolute",
					width: 1,
					height: 1,
					overflow: "hidden",
					clip: "rect(0 0 0 0)",
					whiteSpace: "nowrap",
				}}
			/>

			{uploadError && (
				<Alert severity="error" onClose={() => setUploadError(null)}>
					{uploadError}
				</Alert>
			)}

			<TextField
				value={value}
				onChange={(event) => onChange(event.target.value)}
				fullWidth
				size="small"
				disabled={disabled}
				error={error}
				label={t("consortium.brand.image_url")}
				helperText={helperText}
			/>
		</Stack>
	);
}
