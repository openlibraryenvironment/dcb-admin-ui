import { RemoveCircle } from "@mui/icons-material";
import {
	Box,
	Button,
	CircularProgress,
	Stack,
	styled,
	SvgIconProps,
} from "@mui/material";
import { forwardRef, ReactElement, ChangeEvent } from "react";

const VisuallyHiddenInput = styled("input")`
	clip: rect(0 0 0 0);
	clip-path: inset(50%);
	height: 1px;
	overflow: hidden;
	position: absolute;
	bottom: 0;
	left: 0;
	white-space: nowrap;
	width: 1px;
`;

interface FileUploadButtonProps {
	buttonText: string;
	href: string;
	icon: ReactElement<SvgIconProps>;
	isUploading: boolean;
	onFileSelect?: (event: ChangeEvent<HTMLInputElement>) => void;
	previewUrl?: string;
	showPreview?: boolean;
	handleRemove: any;
}

const FileUploadButton = forwardRef<HTMLInputElement, FileUploadButtonProps>(
	(
		{
			buttonText,
			href,
			icon,
			isUploading,
			onFileSelect,
			previewUrl,
			showPreview = true,
			handleRemove,
		},
		ref,
	) => {
		return (
			<Stack spacing={2}>
				<Button
					component="label"
					variant="outlined"
					startIcon={icon}
					href={href}
				>
					{isUploading ? (
						<CircularProgress
							color="inherit"
							size={13}
							sx={{ marginLeft: "10px" }}
						/>
					) : null}
					{buttonText}
					<VisuallyHiddenInput
						name="file"
						ref={ref}
						type="file"
						required
						onChange={onFileSelect}
						accept="image/*"
					/>
				</Button>
				{showPreview && previewUrl && (
					<Box
						sx={{
							mt: 2,
							maxWidth: "200px",
							maxHeight: "200",
							overflow: "hidden",
							borderRadius: 1,
							border: "1px solid",
							borderColor: "divider",
						}}
					>
						<Button
							onClick={handleRemove}
							aria-label="Remove image"
							className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-lg hover:bg-gray-100"
							startIcon={<RemoveCircle />}
						></Button>
						{/* Just until we figure out the issues with <Image */}
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img
							src={previewUrl}
							alt="Preview"
							style={{
								width: "100%",
								height: "100%",
								objectFit: "contain",
							}}
						/>
					</Box>
				)}
			</Stack>
		);
	},
);

FileUploadButton.displayName = "FileUploadButton";

export default FileUploadButton;
