import React from "react";
import ReactMarkdown from "react-markdown";
import { Link } from "@tanstack/react-router"; // UPGRADE: Swapped from next/link
import { Typography, Link as MuiLink, Box } from "@mui/material";

interface CustomLinkProps {
	href?: string;
	children?: React.ReactNode;
}

// Custom link renderer to ensure external links open in new tab safely
export const CustomLink = ({ href, children }: CustomLinkProps) => {
	const isExternalLink =
		href && (href.startsWith("http://") || href.startsWith("https://"));

	if (isExternalLink) {
		return (
			<MuiLink
				href={href}
				target="_blank"
				rel="noopener noreferrer"
				sx={{ color: "primary.main", textDecoration: "underline" }}
			>
				{children}
			</MuiLink>
		);
	}

	// UPGRADE: Uses TanStack Router's 'to' path designation mapping property natively
	return (
		<Link
			to={href || ""}
			style={{ color: "#1976d2", textDecoration: "underline" }}
		>
			{children}
		</Link>
	);
};

interface MarkdownDescriptionProps {
	content: string;
	editMode?: boolean;
}

const MarkdownDescription: React.FC<MarkdownDescriptionProps> = ({
	content,
	editMode,
}) => {
	// If in edit mode, show raw text shell
	if (editMode) {
		return <Typography variant="body1">{content}</Typography>;
	}

	return (
		<ReactMarkdown
			components={{
				a: CustomLink,
				p: ({ children }) => (
					<Typography variant="body1" sx={{ mb: 1 }}>
						{children}
					</Typography>
				),
				h1: ({ children }) => (
					<Typography variant="h1" sx={{ mb: 2 }}>
						{children}
					</Typography>
				),
				h2: ({ children }) => (
					<Typography variant="h2" sx={{ mb: 1.5 }}>
						{children}
					</Typography>
				),
				h3: ({ children }) => (
					<Typography variant="h3" sx={{ mb: 1 }}>
						{children}
					</Typography>
				),
				strong: ({ children }) => (
					<Box component="strong" sx={{ fontWeight: "bold" }}>
						{children}
					</Box>
				),
				em: ({ children }) => (
					<Box component="em" sx={{ fontStyle: "italic" }}>
						{children}
					</Box>
				),
			}}
		>
			{content}
		</ReactMarkdown>
	);
};

export default MarkdownDescription;
