import React, { forwardRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Link } from "@tanstack/react-router";
import {
	Typography,
	Link as MuiLink,
	Box,
	FormHelperText,
	Paper,
	TextField,
	Tabs,
	Tab,
} from "@mui/material";
import { InfoOutlined } from "@mui/icons-material";
import { t } from "i18next";

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

	return (
		<MuiLink
			component={Link}
			to={href || ""}
			sx={{ color: "primary.main", textDecoration: "underline" }}
		>
			{children}
		</MuiLink>
	);
};

interface MarkdownInputProps {
	/** The markdown string */
	value?: string;
	/** Fired when the text changes (used by react-hook-form) */
	onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
	/** Fired when the input loses focus */
	onBlur?: React.FocusEventHandler<HTMLInputElement>;
	/** If false, renders the read-only markdown viewer. If true, renders the editor. */
	editMode?: boolean;
	/** Error state from react-hook-form */
	error?: boolean;
	/** Helper or error text to display below the input */
	helperText?: string;
}

const MarkdownInput = forwardRef<HTMLDivElement, MarkdownInputProps>(
	({ value = "", onChange, onBlur, editMode, error, helperText }, ref) => {
		const [tab, setTab] = useState(0);

		if (!editMode) {
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
					{value}
				</ReactMarkdown>
			);
		}

		// edit mode
		return (
			<Box
				ref={ref}
				sx={{ display: "flex", flexDirection: "column", width: "100%" }}
			>
				<Box sx={{ borderBottom: 1, borderColor: "divider", mb: 1 }}>
					<Tabs
						value={tab}
						onChange={(_, newValue) => setTab(newValue)}
						aria-label={t("ui.markdown.tabs")}
					>
						<Tab label={t("ui.markdown.write")} />
						<Tab label={t("ui.markdown.preview")} />
					</Tabs>
				</Box>

				{tab === 0 ? (
					<TextField
						multiline
						minRows={5}
						fullWidth
						value={value}
						onChange={onChange}
						onBlur={onBlur}
						error={error}
						placeholder={t("ui.markdown.type")}
						slotProps={{
							htmlInput: {
								"aria-label": t("ui.markdown.input"),
							},
						}}
					/>
				) : (
					<Paper
						variant="outlined"
						sx={{
							p: 2,
							minHeight: "144px", // Roughly matches 5 rows of text
							backgroundColor: "background.default",
							overflowY: "auto",
						}}
					>
						{value.trim() ? (
							<MarkdownInput value={value} editMode={false} />
						) : (
							<Typography color="text.secondary" sx={{ fontStyle: "italic" }}>
								{t("ui.markdown.no_preview")}
							</Typography>
						)}
					</Paper>
				)}

				{/* UX Guidance for Markdown */}
				<Box
					sx={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						mt: 0.5,
						px: 1,
					}}
				>
					<FormHelperText error={error} sx={{ m: 0 }}>
						{helperText}
					</FormHelperText>
					{tab === 0 && (
						<MuiLink
							href="https://www.markdownguide.org/cheat-sheet/"
							target="_blank"
							rel="noopener"
							sx={{
								display: "flex",
								alignItems: "center",
								gap: 0.5,
								fontSize: "0.75rem",
							}}
						>
							<InfoOutlined fontSize="inherit" />
							{t("ui.markdown.format_guide")}
						</MuiLink>
					)}
				</Box>
			</Box>
		);
	},
);

MarkdownInput.displayName = "MarkdownInput";
export default MarkdownInput;
