import { PropsWithChildren, ReactNode, useState } from "react";
import Head from "next/head";
import Footer from "@layout/AdminLayout/Footer/Footer";
import Header from "./Header/Header";
import Breadcrumbs from "./Breadcrumbs/Breadcrumbs";
import { Stack, Typography, useTheme, Box } from "@mui/material";
import Sidebar from "@layout/AdminLayout/Sidebar/Sidebar";
import LinkedFooter from "./LinkedFooter/LinkedFooter";
import PageActionsMenu, {
	Action,
} from "@components/PageActionsMenu/PageActionsMenu";
import { useSession } from "next-auth/react";
import { adminOrConsortiumAdmin } from "src/constants/roles";
interface AdminLayoutProps {
	title?: string;
	children?: ReactNode;
	hideTitleBox?: boolean;
	hideBreadcrumbs?: boolean;
	pageActions?: Action[] | ReactNode[];
	mode?: "edit" | "view";
}

// This layout takes the following props: a title and components to be rendered as children
// It is intended for use with pages that have a title, a footer, and a single content area.
// Different layouts may be required for other pages in DCB Admin.

// Title component must have a white background.

export default function AdminLayout({
	title,
	children,
	hideTitleBox,
	hideBreadcrumbs,
	pageActions,
	mode,
}: PropsWithChildren<AdminLayoutProps>) {
	const [sidebarOpen, setSidebarOpen] = useState(true);
	const theme = useTheme();
	const { data: session } = useSession();
	const isAnAdmin = session?.profile?.roles?.some((role: string) =>
		adminOrConsortiumAdmin.includes(role),
	);
	return (
		<>
			<Head>
				<link rel="icon" href="/favicon.ico" />
			</Head>
			<Header openStateFuncClosed={() => setSidebarOpen(!sidebarOpen)} />
			{/*container for everything, includes the sidebar*/}
			<Box
				sx={{
					display: "flex",
					height: "100%",
					width: "100%",
					flexDirection: "column",
					minHeight: "100vh",
					backgroundColor: theme.palette.primary.pageBackground,
				}}
			>
				{/* Container for centring content in the middle of the screen */}
				{/* flex: '1 0 auto' - child element grows to fill space and pushes the footer to the bottom*/}
				<Box
					sx={{
						display: "flex",
						maxWidth: "1400px",
						height: "100%",
						width: "100%",
						alignSelf: "center",
						flex: "1 0 auto",
						backgroundColor: theme.palette.primary.pageContentBackground,
					}}
				>
					<Box>
						<Sidebar
							openStateOpen={sidebarOpen}
							openStateFuncOpen={() => {
								setSidebarOpen(sidebarOpen);
							}}
							openStateFuncClosed={() => setSidebarOpen(!sidebarOpen)}
						/>
					</Box>
					{/* Container for content excluding the sidebar
						- flexGrow makes the content grow to the window size
						- overflow: auto, means that content does not go beyond its container
						- minHeight must be 100vh for the footer to be at the bottom of the screen
					*/}
					<Box
						display="flex"
						sx={{
							flexGrow: 3,
							overflow: "auto",
							display: "flex",
							flexDirection: "column",
						}}
					>
						{/* MarginTop: 9 is to stop the breadcrumbs entering header area */}
						<Stack
							spacing={2}
							sx={{ height: "100%", width: "100%", marginTop: 9 }}
						>
							{hideBreadcrumbs != true ? (
								<Box>
									<Breadcrumbs titleAttribute={title} />
								</Box>
							) : null}
							{/* Title
								- height: 90px & p: 3 - this is to make the text appear centered
							*/}
							{/* Only render tile box if the value from page props is true */}
							{hideTitleBox != true ? (
								<Box
									sx={{
										marginTop: 1,
										marginBottom: 1,
										height: "100%",
										// grow and shrink as needed to fill the available space in the flex container
										flex: "0",
										backgroundColor: theme.palette.primary.titleArea,
									}}
								>
									<Stack
										direction="row"
										alignItems="center"
										justifyContent="space-between"
										sx={{ p: 3, pb: 0 }} // Optional padding adjustments
									>
										{title != null ? (
											<Typography id="page-title" variant="h1">
												{title}
											</Typography>
										) : null}
										{pageActions && isAnAdmin && (
											<PageActionsMenu
												actions={pageActions}
												mode={mode || "view"}
											/>
										)}
									</Stack>
								</Box>
							) : null}

							<Box sx={{ pl: 3, pr: 3, paddingBottom: 3, height: "100%" }}>
								{children}
							</Box>
						</Stack>
					</Box>
				</Box>
				{/* Footer
				- flexShrink: 0 - flex item does not shrink
			*/}
				<Box
					sx={{
						overflow: "auto",
						backgroundColor: theme.palette.primary.linkedFooterBackground,
						paddingBottom: 2,
						paddingTop: 2,
						flexShrink: 0,
					}}
				>
					<LinkedFooter />
				</Box>
				<Box
					sx={{
						overflow: "auto",
						backgroundColor: theme.palette.primary.footerArea,
						padding: 2,
						flexShrink: 0,
					}}
				>
					<Footer />
				</Box>
			</Box>
		</>
	);
}
