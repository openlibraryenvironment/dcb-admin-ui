import { PropsWithChildren, ReactNode, useEffect, useState } from "react";
import { useAuth } from "react-oidc-context";
import { Stack, Typography, useTheme, Box, Button } from "@mui/material";
import { BookOutlined } from "@mui/icons-material";

import Header from "./Header/Header";
import Sidebar from "./Sidebar/Sidebar";
import Breadcrumbs from "./Breadcrumbs/Breadcrumbs";
import Footer from "./Footer/Footer";
import LinkedFooter from "./LinkedFooter/LinkedFooter";

import PageActionsMenu from "@components/PageActionsMenu/PageActionsMenu";
import Link from "@components/Link/Link";
import { adminOrConsortiumAdmin } from "@constants/roles";

interface AdminLayoutProps {
	title?: string;
	children?: ReactNode;
	hideTitleBox?: boolean;
	hideBreadcrumbs?: boolean;
	pageActions?: any;
	mode?: "edit" | "view";
	link?: string;
	docLink?: string;
	subtitle?: string;
}

export default function AdminLayout({
	title,
	children,
	hideTitleBox,
	hideBreadcrumbs,
	pageActions,
	mode,
	link,
	docLink,
	subtitle,
}: PropsWithChildren<AdminLayoutProps>) {
	const [sidebarOpen, setSidebarOpen] = useState(true);
	const theme = useTheme();

	const auth = useAuth();
	const userRoles = (auth?.user?.profile?.roles as string[]) || [];
	const isAnAdmin = userRoles.some((role) =>
		adminOrConsortiumAdmin.includes(role),
	);

	useEffect(() => {
		const baseAppTitle = "DCB Admin";
		if (title) {
			document.title = `${title} | ${baseAppTitle}`;
		} else {
			document.title = baseAppTitle;
		}

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
		<Box
			sx={{
				display: "flex",
				height: "100%",
				width: "100%",
				flexDirection: "column",
				minHeight: "100vh",
				backgroundColor: "primary.pageBackground",
			}}
		>
			<Header openStateFuncClosed={() => setSidebarOpen(!sidebarOpen)} />

			<Box
				sx={{
					display: "flex",
					maxWidth: "1400px",
					height: "100%",
					width: "100%",
					alignSelf: "center",
					flex: "1 0 auto",
					backgroundColor: "primary.pageContentBackground",
				}}
			>
				<Sidebar
					openStateOpen={sidebarOpen}
					openStateFuncOpen={() => setSidebarOpen(true)}
					openStateFuncClosed={() => setSidebarOpen(false)}
				/>

				<Box
					sx={{
						flexGrow: 3,
						overflow: "auto",
						display: "flex",
						flexDirection: "column",
					}}
				>
					<Stack
						spacing={2}
						sx={{ height: "100%", width: "100%", marginTop: 9 }}
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
									alignItems="center"
									justifyContent="space-between"
									sx={{ p: 3, pb: 0 }}
								>
									{title && (
										<Stack direction="column" spacing={1} alignItems="baseline">
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
										<PageActionsMenu
											actions={pageActions}
											mode={mode || "view"}
										/>
									)}
								</Stack>
							</Box>
						)}

						<Box sx={{ px: 3, pb: 3, height: "100%" }}>{children}</Box>
					</Stack>
				</Box>
			</Box>

			<Box
				sx={{
					overflow: "auto",
					backgroundColor: "primary.linkedFooterBackground",
					py: 2,
					flexShrink: 0,
				}}
			>
				<LinkedFooter />
			</Box>
			<Box
				sx={{
					overflow: "auto",
					backgroundColor: "primary.footerArea",
					p: 2,
					flexShrink: 0,
				}}
			>
				<Footer />
			</Box>
		</Box>
	);
}
