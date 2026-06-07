import { forwardRef } from "react";
import { Link as TanStackLink } from "@tanstack/react-router";
import MuiLink, { LinkProps as MuiLinkProps } from "@mui/material/Link";
import { useTheme } from "@mui/material/styles";

export interface CustomLinkProps extends Omit<
	MuiLinkProps,
	"href" | "classes"
> {
	href?: string;
	to?: string;
	search?: any; // Added to support TanStack query parameters
	params?: any; // Added to support TanStack path parameters
	noLinkStyle?: boolean;
	className?: string;
}

const Link = forwardRef<HTMLAnchorElement, CustomLinkProps>(function Link(
	{ href, to, search, params, noLinkStyle, className, sx, ...other },
	ref,
) {
	const theme = useTheme();
	const destination = to || href;

	const isExternal =
		typeof destination === "string" &&
		(destination.startsWith("http") || destination.startsWith("mailto:"));

	const baseStyles = {
		color: theme.palette.primary.linkText,
		textDecoration: noLinkStyle ? "none" : undefined,
		...sx,
	};

	if (isExternal) {
		return (
			<MuiLink
				ref={ref}
				href={destination}
				target={destination?.startsWith("http") ? "_blank" : undefined}
				rel={
					destination?.startsWith("http") ? "noopener noreferrer" : undefined
				}
				className={className}
				sx={baseStyles}
				{...other}
			/>
		);
	}

	return (
		<MuiLink
			component={TanStackLink}
			to={destination as any}
			search={search}
			params={params}
			ref={ref}
			className={className}
			sx={baseStyles}
			{...other}
		/>
	);
});

export default Link;
