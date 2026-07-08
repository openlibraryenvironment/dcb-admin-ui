import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "react-oidc-context";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { isEmpty } from "lodash";

import {
	Box,
	Toolbar,
	Typography,
	IconButton,
	Button,
	lighten,
	styled,
	useTheme,
} from "@mui/material";
import MuiAppBar, { AppBarProps as MuiAppBarProps } from "@mui/material/AppBar";
import { Menu, AccountCircle } from "@mui/icons-material";

import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { useGridStore } from "@/hooks/useDataGridStore";
import { useConsortiumInfoStore } from "@hooks/consortiumInfoStore";
import useDCBVersionStore from "@hooks/serviceInfoStore";
import useDCBServiceInfo from "@hooks/useDCBServiceInfo";

import { getConsortiumBasics } from "@queries/getConsortiumBasics";
import fallbackHeaderSrc from "@assets/brand/fallback-header.png";

interface AppBarProps extends MuiAppBarProps {
	open?: boolean;
}

interface HeaderProps {
	onMenuClick?: () => void;
	menuOpen?: boolean;
	iconsVisible?: boolean;
}

const AppBar = styled(MuiAppBar, {
	shouldForwardProp: (prop) => prop !== "open",
})<AppBarProps>(({ theme }) => ({
	zIndex: theme.zIndex.drawer + 1,
}));

export default function Header({
	onMenuClick,
	menuOpen = false,
	iconsVisible = true,
}: HeaderProps) {
	const theme = useTheme();
	const navigate = useNavigate();
	const { t } = useTranslation();
	const gqlClient = useGraphQLClient();

	const auth = useAuth();
	const { type } = useDCBServiceInfo();
	const clearGridState = useGridStore((state) => state.clearGridState);
	const clearVersionStore = useDCBVersionStore(
		(state) => state.clearVersionStore,
	);

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

	const handleAuthClick = () => {
		if (auth.isAuthenticated) {
			clearGridState();
			clearVersionStore();
			auth.signoutRedirect({
				post_logout_redirect_uri: `${window.location.origin}/logout?loggedOut=true`,
			});
		} else {
			auth.signinRedirect();
		}
	};

	const { data: headerContentData } = useQuery({
		queryKey: ["consortiaKeyInfo"],
		enabled: auth.isAuthenticated,
		throwOnError: false,
		queryFn: () =>
			gqlClient.request<any>(getConsortiumBasics, {
				order: "name",
				orderBy: "ASC",
				pagesize: 1,
				pageno: 0,
			}),
	});

	const consortium = headerContentData?.consortia?.content?.[0];

	// Sync consortium store state if data changes
	useEffect(() => {
		if (consortium && consortium.displayName !== displayName) {
			setName(consortium.name);
			setDisplayName(consortium.displayName);
			setDescription(consortium.description);
			setCatalogueSearchURL(consortium.catalogueSearchUrl);
			setWebsiteURL(consortium.websiteUrl);
			setHeaderImageURL(consortium.headerImageUrl);
			if (!isEmpty(consortium.aboutImageUrl)) {
				setAboutImageURL(consortium.aboutImageUrl);
			}
		}
	}, [
		consortium,
		displayName,
		setName,
		setDisplayName,
		setDescription,
		setCatalogueSearchURL,
		setWebsiteURL,
		setHeaderImageURL,
		setAboutImageURL,
	]);

	const pageTitle = t("app.title", {
		consortium_name: isEmpty(displayName)
			? consortium?.displayName
			: displayName,
		environment: type,
	});

	return (
		<Box>
			<AppBar
				position="fixed"
				sx={{ backgroundColor: "primary.header", maxHeight: "70px" }}
			>
				<Toolbar
					disableGutters
					sx={{
						maxWidth: "1400px",
						alignSelf: "center",
						width: "100%",
						padding: 0,
						maxHeight: "70px",
						px: iconsVisible ? "24px" : "16px",
					}}
				>
					{iconsVisible && (
						<Box>
							<IconButton
								data-tid="sidebar-menu"
								size="large"
								edge="start"
								aria-label={String(t("nav.toggle_menu"))}
								aria-expanded={menuOpen}
								aria-controls="main-sidebar-nav"
								onClick={onMenuClick}
								sx={{
									mr: 2,
									color: "primary.headerText",
									":hover": {
										backgroundColor: lighten(
											theme.palette.primary.header as string,
											theme.palette.mode === "light" ? 0.08 : 0.16,
										),
									},
									":active": {
										backgroundColor: lighten(
											theme.palette.primary.header as string,
											theme.palette.mode === "light" ? 0.16 : 0.24,
										),
									},
								}}
							>
								<Menu sx={{ fontSize: 20 }} data-tid="menu-icon" />
							</IconButton>
						</Box>
					)}

					<Box
						component="img"
						src={isEmpty(headerImageURL) ? fallbackHeaderSrc : headerImageURL}
						alt={String(t("consortium.logo_app_header"))}
						sx={{ width: 36, height: 36, mt: !iconsVisible ? 1 : 0 }}
					/>

					<Typography
						data-tid="header-title"
						variant="appTitle"
						component="div"
						sx={{
							color: "primary.headerText",
							fontWeight: "bold",
							flexGrow: 1,
							pl: 2,
						}}
					>
						{pageTitle}
					</Typography>

					{iconsVisible && (
						<Box
							sx={{
								display: "flex",
								alignItems: "center",
								gap: 1,
								flexShrink: 0,
							}}
						>
							<IconButton
								size="large"
								data-tid="profile-button"
								aria-label="account of current user"
								onClick={() => navigate({ to: "/profile" })}
								sx={{
									color: "primary.headerText",
									":hover": {
										backgroundColor: lighten(
											theme.palette.primary.header as string,
											theme.palette.mode === "light" ? 0.08 : 0.16,
										),
									},
									":active": {
										backgroundColor: lighten(
											theme.palette.primary.header as string,
											theme.palette.mode === "light" ? 0.16 : 0.24,
										),
									},
								}}
							>
								<AccountCircle sx={{ fontSize: 20 }} />
							</IconButton>

							<Button
								data-tid="login-button"
								aria-label={auth.isAuthenticated ? "Logout" : "Login"}
								onClick={handleAuthClick}
								sx={{
									color: "primary.headerText",
									p: 1,
									minWidth: "0px",
									"&.Mui-focusVisible": { outlineColor: "#FFFFFF" },
									":hover": {
										backgroundColor: lighten(
											theme.palette.primary.header as string,
											theme.palette.mode === "light" ? 0.08 : 0.16,
										),
									},
									":active": {
										backgroundColor: lighten(
											theme.palette.primary.header as string,
											theme.palette.mode === "light" ? 0.16 : 0.24,
										),
									},
								}}
							>
								{auth.isAuthenticated ? t("nav.logout") : t("nav.login")}
							</Button>
						</Box>
					)}
				</Toolbar>
			</AppBar>
		</Box>
	);
}
