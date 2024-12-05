import React from "react";
import ReactMarkdown from "react-markdown";
import Link from "next/link";
import { Typography } from "@mui/material";

// Custom link renderer to ensure external links open in new tab
export const CustomLink = ({
	href,
	children,
}: {
	href?: string;
	children?: React.ReactNode;
}) => {
	const isExternalLink =
		href && (href.startsWith("http://") || href.startsWith("https://"));

	if (isExternalLink) {
		return (
			<a
				href={href}
				target="_blank"
				rel="noopener noreferrer"
				style={{ color: "#1976d2", textDecoration: "underline" }}
			>
				{children}
			</a>
		);
	}

	return <Link href={href || ""}>{children}</Link>;
};

interface MarkdownDescriptionProps {
	content: string;
	editMode?: boolean;
}

const MarkdownDescription: React.FC<MarkdownDescriptionProps> = ({
	content,
	editMode,
}) => {
	// If in edit mode, show raw text
	if (editMode) {
		return <Typography variant="body1">{content}</Typography>;
	}

	return (
		<ReactMarkdown
			components={{
				a: CustomLink,
				p: ({ children }) => (
					<Typography variant="body1">{children}</Typography>
				),
				h1: ({ children }) => <Typography variant="h1">{children}</Typography>,
				h2: ({ children }) => <Typography variant="h2">{children}</Typography>,
				h3: ({ children }) => <Typography variant="h3">{children}</Typography>,
				strong: ({ children }) => (
					<strong style={{ fontWeight: "bold" }}>{children}</strong>
				),
				em: ({ children }) => (
					<em style={{ fontStyle: "italic" }}>{children}</em>
				),
			}}
		>
			{content}
		</ReactMarkdown>
	);
};

export default MarkdownDescription;
