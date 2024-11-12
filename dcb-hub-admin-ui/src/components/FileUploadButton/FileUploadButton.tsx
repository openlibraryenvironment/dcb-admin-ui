import { Button, CircularProgress, styled, SvgIconProps } from "@mui/material";
import { RefObject } from "react";

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

export default function FileUploadButton({
	ref,
	buttonText,
	href,
	icon,
	isUploading,
}: {
	ref: RefObject<HTMLInputElement>;
	buttonText: string;
	href: string;
	icon: React.ReactElement<SvgIconProps>;
	isUploading: boolean;
}) {
	return (
		<Button component="label" variant="contained" startIcon={icon} href={href}>
			{isUploading ? (
				<CircularProgress
					color="inherit"
					size={13}
					sx={{ marginLeft: "10px" }}
				/>
			) : null}
			{buttonText}
			<VisuallyHiddenInput name="file" ref={ref} type="file" required />
		</Button>
	);
}
