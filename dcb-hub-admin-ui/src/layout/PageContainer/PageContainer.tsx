import { PropsWithChildren, useEffect } from "react";
import { useAuth } from "react-oidc-context";
import { Stack, Typography, Box, Button } from "@mui/material";
import { BookOutlined } from "@mui/icons-material";

import Breadcrumbs from "../Breadcrumbs/Breadcrumbs";
import PageActionsMenu from "@components/PageActionsMenu/PageActionsMenu";
import Link from "@components/Link/Link";
import { adminOrConsortiumAdmin } from "@constants/roles";

interface PageContainerProps {
	title?: string;
	hideTitleBox?: boolean;
	hideBreadcrumbs?: boolean;
	pageActions?: any;
	mode?: "edit" | "view";
	link?: string;
	docLink?: string;
	subtitle?: string;
}

export default function PageContainer({
	title,
	children,
	hideTitleBox,
	hideBreadcrumbs,
	pageActions,
	mode,
	link,
	docLink,
	subtitle,
}: PropsWithChildren<PageContainerProps>) {
	const auth = useAuth();
	const userRoles = (auth?.user?.profile?.roles as string[]) || [];
	const isAnAdmin = userRoles.some((role) =>
		adminOrConsortiumAdmin.includes(role),
	);

	useEffect(() => {
		const baseAppTitle = "DCB Admin";
		document.title = title ? `${baseAppTitle} | ${title} ` : baseAppTitle;
		return () => {
			document.title = baseAppTitle;
		};
	}, [title]);

	const renderTitle = () => {
		if (!link || !title)
			return (
				<Typography id="page-title" variant="h1">
					{title}
				</Typography>
			);

		const dcbMatch = title.match(/(DCB-\d+)/);
		if (dcbMatch) {
			const [dcbPart] = dcbMatch;
			const beforeDcb = title.slice(0, dcbMatch.index);
			const afterDcb = title.slice((dcbMatch.index ?? 0) + dcbPart.length);

			return (
				<Typography id="page-title" variant="h1">
					{beforeDcb}
					{dcbPart !== "DCB-????" ? (
						<Link href={link}>{dcbPart}</Link>
					) : (
						dcbPart
					)}
					{afterDcb}
				</Typography>
			);
		}
		return (
			<Typography id="page-title" variant="h1">
				{title}
			</Typography>
		);
	};

	return (
		/*
		 * THE MAIN LANDMARK, for 78 of the 84 routes - this component wraps all of them
		 * except the login shell, which carries its own.
		 *
		 * There was no <main> anywhere in the application. A screen-reader user had no
		 * way to jump past the header and the twelve-item sidebar, and the skip link in
		 * StructuralLayout has nothing to target without it - measured at fifteen tab
		 * stops from the top of the page to its first control.
		 *
		 * tabIndex={-1} is load-bearing, not decoration: a skip link whose target cannot
		 * receive focus moves the viewport and leaves focus where it was, so the next Tab
		 * goes straight back into the navigation the user was trying to skip. The outline
		 * is suppressed because this element is only ever focused programmatically, and a
		 * ring around the whole page is noise rather than information.
		 */
		<Stack
			component="main"
			id="main-content"
			tabIndex={-1}
			spacing={2}
			sx={{ height: "100%", width: "100%", outline: "none" }}
		>
			{!hideBreadcrumbs && title && (
				<Box>
					<Breadcrumbs titleAttribute={title} />
				</Box>
			)}
			{!hideTitleBox && (
				<Box
					sx={{
						my: 1,
						height: "100%",
						flex: "0",
						backgroundColor: "primary.titleArea",
					}}
				>
					<Stack
						direction="row"
						sx={{
							alignItems: "center",
							justifyContent: "space-between",
							p: 3,
							pb: 0,
						}}
					>
						{title && (
							<Stack
								direction="column"
								spacing={1}
								sx={{
									alignItems: "baseline",
								}}
							>
								{renderTitle()}
								{docLink && (
									<Button
										variant="outlined"
										startIcon={<BookOutlined />}
										href={docLink}
										size="small"
									>
										{subtitle || docLink}
									</Button>
								)}
							</Stack>
						)}
						{pageActions && isAnAdmin && (
							<PageActionsMenu actions={pageActions} mode={mode || "view"} />
						)}
					</Stack>
				</Box>
			)}
			<Box sx={{ px: 3, pb: 3, height: "100%" }}>{children}</Box>
		</Stack>
	);
}
