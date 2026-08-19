import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import {
	BRAND_IMAGE_ACCEPT,
	BRAND_IMAGE_MAX_BYTES,
} from "@constants/discoveryBranding";

type Props = {
	/** The stored value. Whichever control produced it, it is one column. */
	value: string;
	onChange: (value: string) => void;
	/** The file chosen but not yet uploaded, if any. Owned by the form. */
	stagedFile: File | null;
	onStageFile: (file: File | null) => void;
	label: string;
	helperText: string;
	error?: boolean;
	disabled?: boolean;
	/**
	 * Whether this deployment stores uploads at all, from `/info`'s
	 * `dcb.branding.assets.store`. When false the upload control is not rendered — a
	 * deployment with `store=none` has no upload route, and offering a button that can only
	 * ever 404 is worse than not offering one.
	 */
	uploadsAvailable?: boolean;
};

/**
 * One brand image, two ways to supply it — R-17e.
 *
 * <h2>Neither control is the fallback for the other</h2>
 *
 * A consortium with a brand team and a CDN must not be made to re-upload into our storage.
 * A consortium with neither must not be told to go and find hosting before it can have a
 * logo. So both controls are here and they write to the same field, because the column
 * stores a URL either way.
 *
 * <h2>Choosing a file does not upload it</h2>
 *
 * The file is held here and uploaded by the form when the administrator saves. Uploading at
 * pick time left a stored image behind every time somebody changed their mind or closed the
 * tab — dcb-service cannot distinguish those from an image about to be used, so it keeps
 * them for a day and sweeps them. Staging makes that the rare case rather than the ordinary
 * one. See `helpers/brandAssetUpload.ts`.
 *
 * The consequence is that a rejected image is reported at Save rather than at pick, so the
 * size check below matters more than it used to: it is the one refusal we can still give
 * immediately. It remains a courtesy and not a control — dcb-service sniffs magic bytes,
 * enforces byte and dimension caps from the image header before any decode, and re-encodes
 * what it stores. Nothing a browser says is evidence about the bytes.
 *
 * <h2>The accepted formats are stated BEFORE the file picker</h2>
 *
 * PNG or JPEG, said next to the button rather than discovered from a rejected upload. SVG
 * is refused because it is a script-capable document and one served from our origin would
 * be stored XSS in the chrome of every patron page; WebP is refused because it cannot be
 * re-encoded server-side, and an image we cannot decode is one we will not store.
 */
export function BrandImageField({
	value,
	onChange,
	stagedFile,
	onStageFile,
	label,
	helperText,
	error,
	disabled,
	uploadsAvailable = true,
}: Props) {
	const { t } = useTranslation();
	const fileInput = useRef<HTMLInputElement>(null);

	const [pickError, setPickError] = useState<string | null>(null);

	// A staged file has no URL to render, so it is previewed from an object URL. DERIVED
	// rather than held in state: it is a pure function of the staged file, and setting it
	// from an effect would make every pick two renders instead of one.
	const preview = useMemo(
		() => (stagedFile ? URL.createObjectURL(stagedFile) : null),
		[stagedFile],
	);

	// The effect exists only to release it. An object URL pins the file in memory until
	// revoked, so a form where somebody tries three logos would hold all three.
	useEffect(() => {
		if (!preview) {
			return;
		}

		return () => URL.revokeObjectURL(preview);
	}, [preview]);

	const handleFile = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		// Reset immediately, so choosing the same file twice after a failure still fires a
		// change event.
		event.target.value = "";
		if (!file) {
			return;
		}

		if (file.size > BRAND_IMAGE_MAX_BYTES) {
			setPickError(t("consortium.brand.upload_too_large"));
			onStageFile(null);
			return;
		}

		setPickError(null);
		onStageFile(file);
	};

	const clearStaged = () => {
		setPickError(null);
		onStageFile(null);
	};

	return (
		<Stack direction="column" spacing={1}>
			{uploadsAvailable && (
				<Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
					<Button
						variant="outlined"
						size="small"
						disabled={disabled}
						onClick={() => fileInput.current?.click()}
					>
						{t("consortium.brand.upload")}
					</Button>
					<Typography variant="body2" color="text.secondary">
						{t("consortium.brand.upload_formats")}
					</Typography>
				</Stack>
			)}

			{/* Visually hidden rather than display:none — a hidden input is still the
			    labelled control the button proxies for, and display:none takes it out of
			    the accessibility tree entirely. */}
			{uploadsAvailable && (
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
			)}

			{pickError && (
				<Alert severity="error" onClose={() => setPickError(null)}>
					{pickError}
				</Alert>
			)}

			{/* Announced, because the change that matters here is that the field now holds
			    something the URL box does not show. A staged file is invisible otherwise. */}
			{stagedFile && (
				<Alert
					severity="info"
					role="status"
					action={
						<Button color="inherit" size="small" onClick={clearStaged}>
							{t("consortium.brand.staged_remove")}
						</Button>
					}
				>
					<Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
						{preview && (
							<Box
								component="img"
								src={preview}
								alt=""
								sx={{ maxHeight: 32, maxWidth: 96, objectFit: "contain" }}
							/>
						)}
						<span>
							{t("consortium.brand.staged", { filename: stagedFile.name })}
						</span>
					</Stack>
				</Alert>
			)}

			<TextField
				value={value}
				onChange={(event) => onChange(event.target.value)}
				fullWidth
				size="small"
				// Typing a URL and staging a file are alternatives, not a merge: the column
				// holds one value and the staged file would overwrite whatever was typed.
				disabled={disabled || Boolean(stagedFile)}
				error={error}
				label={t("consortium.brand.image_url")}
				helperText={
					stagedFile ? t("consortium.brand.image_url_staged") : helperText
				}
			/>
		</Stack>
	);
}
