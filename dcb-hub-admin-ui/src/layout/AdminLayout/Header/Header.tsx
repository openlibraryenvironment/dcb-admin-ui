import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import { MdMenu, MdAccountCircle } from "react-icons/md";
import Link from "@components/Link/Link";
import { signIn, signOut, useSession } from "next-auth/react";
import { styled, useTheme } from "@mui/material/styles";
import MuiAppBar, { AppBarProps as MuiAppBarProps } from "@mui/material/AppBar";
import { useTranslation } from "next-i18next";
import { Button, lighten } from "@mui/material";
import Image from "next/image";
import { useRouter } from "next/router";
import useDCBServiceInfo from "@hooks/useDCBServiceInfo";
import Head from "next/head";
import { useGridStore } from "@hooks/useDataGridOptionsStore";
import { useConsortiumInfoStore } from "@hooks/consortiumInfoStore";
import { getConsortiaKeyInfo } from "src/queries/queries";
import { useQuery } from "@apollo/client";
import { Consortium } from "@models/Consortium";
import { isEmpty } from "lodash";

interface AppBarProps extends MuiAppBarProps {
	open?: boolean;
}
interface HeaderProps {
	openStateFuncClosed?: any;
	iconsVisible?: boolean;
}

const AppBar = styled(MuiAppBar, {
	shouldForwardProp: (prop) => prop !== "open",
})<AppBarProps>(({ theme }) => ({
	zIndex: theme.zIndex.drawer + 1,
}));

// Note that in dark mode the header's icon button colour changes are greater.
// This is because the standard percentages did not distinguish them enough.
// It's also worth noting that 'lighten' is used irrespective of mode. This is intentional, as the header will always have a dark background.
// Should this change, this approach will need re-visiting.

export default function Header({
	openStateFuncClosed,
	iconsVisible,
}: HeaderProps) {
	const { status } = useSession();
	const theme = useTheme();
	const router = useRouter();
	const { type } = useDCBServiceInfo();
	const {
		headerImageURL,
		displayName,
		setDisplayName,
		setAboutImageURL,
		setDescription,
		setCatalogueSearchURL,
		setWebsiteURL,
		setName,
		setHeaderImageURL,
	} = useConsortiumInfoStore();
	const clearGridState = useGridStore((state) => state.clearGridState);

	const url = "/auth/logout";
	const { t } = useTranslation();
	const handleClick = () => {
		if (status === "authenticated") {
			signOut({ redirect: false });
			clearGridState();
			// clearConsortiumStore();
			router.push(url);
		} else {
			signIn();
		}
	};
	// console.log("Header image URL coming from the header", headerImageURL);
	// console.log(displayName);
	// console.log(type);
	// We need to stop this query constantly firing
	const { data: headerContentData } = useQuery(getConsortiaKeyInfo, {
		variables: {
			order: "name",
			orderBy: "ASC",
			pagesize: 1,
			pageno: 0,
		},
		onCompleted: (data) => {
			const consortium: Consortium = data?.consortia.content[0];
			console.log("This query has completed.");
			// console.log("Query has completed");
			// Check for changes
			if (consortium && consortium.displayName !== displayName) {
				setName(consortium.name);
				setDisplayName(consortium.displayName);
				setAboutImageURL(consortium.aboutImageUrl);
				setHeaderImageURL(consortium.headerImageUrl);
				setDescription(consortium.description);
				setCatalogueSearchURL(consortium.catalogueSearchUrl);
				setWebsiteURL(consortium.websiteUrl);
			}
		},
		fetchPolicy: "cache-and-network", // Fetch from cache first, then network
		nextFetchPolicy: "cache-first", // Subsequent fetches prefer cache
	});
	// skip: headerImageURL != "",

	const consortium: Consortium = headerContentData?.consortia.content[0];
	const fetchedHeaderImageURL = consortium?.headerImageUrl;

	console.log(
		"Header URL",
		headerImageURL,
		" and fetched URL",
		fetchedHeaderImageURL,
	);

	const pageTitle = t("app.title", {
		// consortium_name: consortium?.displayName ?? displayName,
		consortium_name: isEmpty(displayName)
			? consortium?.displayName
			: displayName,
		environment: type,
	});

	return (
		<>
			<Head>
				<title>{pageTitle}</title>
			</Head>
			<Box sx={{ flexGrow: 1 }}>
				{/* A maximum height of 70px is set to stop the header overlapping with the sidebar on small screen sizes */}
				<AppBar
					position="fixed"
					sx={{
						backgroundColor: theme.palette.primary.header,
						maxHeight: "70px",
					}}
				>
					{/* this width is the maxSize of the content */}
					<Toolbar
						disableGutters
						sx={{
							maxWidth: "1400px",
							alignSelf: "center",
							width: "100%",
							padding: 0,
							maxHeight: "70px",
							paddingLeft: iconsVisible != false ? "24px" : "16px",
							paddingRight: iconsVisible != false ? "24px" : "16px",
						}}
					>
						{/* This code handles the display of the consortium icon and sidebar icon.
          By using iconsVisible, we can render the correct UI for the situation  */}
						{iconsVisible != false ? (
							<Box>
								<IconButton
									data-tid="sidebar-menu"
									size="large"
									edge="start"
									aria-label="menu"
									onClick={openStateFuncClosed}
									sx={{
										mr: 2,
										color: theme.palette.primary.headerText,
										":hover": {
											backgroundColor:
												theme.palette.mode == "light"
													? lighten(theme.palette.primary.header, 0.08)
													: lighten(theme.palette.primary.header, 0.16),
										},
										":active": {
											backgroundColor:
												theme.palette.mode == "light"
													? lighten(theme.palette.primary.header, 0.16)
													: lighten(theme.palette.primary.header, 0.24),
										},
									}}
								>
									<MdMenu size={20} data-tid="menu-icon" />
								</IconButton>
							</Box>
						) : null}
						{/* Render just the image if other header icons are visible, 
              or the image and additional padding if the icons have been hidden. */}
						{iconsVisible != false ? (
							<Image
								src={
									isEmpty(headerImageURL)
										? fetchedHeaderImageURL
										: headerImageURL
								}
								alt={t("consortium.logo_app_header")}
								width={36}
								height={36}
							/>
						) : (
							<Box sx={{ mt: 1 }}>
								<Image
									src={
										isEmpty(headerImageURL)
											? fetchedHeaderImageURL
											: headerImageURL
									}
									alt={t("consortium.logo_app_header")}
									width={36}
									height={36}
									style={{
										maxWidth: "200px",
										maxHeight: "200px",
										objectFit: "contain",
										marginTop: "8px",
									}}
								/>
							</Box>
						)}
						<Typography
							data-tid="header-title"
							variant="appTitle"
							component="div"
							sx={{
								color: theme.palette.primary.headerText,
								fontWeight: "bold",
								flexGrow: 1,
								pl: 2,
							}}
						>
							{t("app.title", {
								consortium_name: consortium?.displayName ?? displayName,
								environment: type,
							})}
						</Typography>
						<div>
							{iconsVisible != false ? (
								<IconButton
									size="large"
									data-tid="profile-button"
									aria-label="account of current user"
									sx={{
										color: theme.palette.primary.headerText,
										":hover": {
											backgroundColor:
												theme.palette.mode == "light"
													? lighten(theme.palette.primary.header, 0.08)
													: lighten(theme.palette.primary.header, 0.16),
										},
										":active": {
											backgroundColor:
												theme.palette.mode == "light"
													? lighten(theme.palette.primary.header, 0.16)
													: lighten(theme.palette.primary.header, 0.24),
										},
									}}
									LinkComponent={Link}
									href="/profile"
								>
									<MdAccountCircle size={20} />
								</IconButton>
							) : null}
							{iconsVisible != false ? (
								<Button
									data-tid="login-button"
									aria-label={status === "authenticated" ? "Logout" : "Login"}
									onClick={handleClick}
									/* this removes default styling that was stopping the header and footer from being the same width
                 it also sets the colour of the header text */
									sx={{
										color: theme.palette.primary.headerText,
										p: 1,
										// paddingInline: "0px",
										minWidth: "0px",
										"&.Mui-focusVisible": {
											outlineColor: "#FFFFFF",
										},
										":hover": {
											backgroundColor:
												theme.palette.mode == "light"
													? lighten(theme.palette.primary.header, 0.08)
													: lighten(theme.palette.primary.header, 0.16),
										},
										":active": {
											backgroundColor:
												theme.palette.mode == "light"
													? lighten(theme.palette.primary.header, 0.16)
													: lighten(theme.palette.primary.header, 0.24),
										},
									}}
								>
									{status === "authenticated"
										? t("nav.logout")
										: t("nav.login")}
								</Button>
							) : null}
						</div>
					</Toolbar>
				</AppBar>
			</Box>
		</>
	);
}
