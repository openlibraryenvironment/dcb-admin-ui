import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "react-oidc-context";
import { useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { useConsortiumInfoStore } from "@hooks/consortiumInfoStore";
import useDCBServiceInfo from "@hooks/useDCBServiceInfo";
import { appUrl, clearAppStorage } from "@helpers/appBase";
import {
	assertOidcAuthorityReachable,
	isOidcAuthorityUnavailableError,
	oidcDiscoveryUrl,
} from "@helpers/oidcPreflight";

import { getConsortiumBasics } from "@queries/getConsortiumBasics";
import fallbackHeaderSrc from "@assets/brand/fallback-header.png";
import type { LoadConsortiumHeaderQueryVariables } from "@generated/graphql";

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
	const queryClient = useQueryClient();

	const {
		headerImageURL,
		displayName,
		setDisplayName,
		setAboutImageURL,
		setDescription,
		setCatalogueSearchURL,
		setWebsiteURL,
		resetConsortiumStore,
		setName,
		setHeaderImageURL,
	} = useConsortiumInfoStore();

	const handleAuthClick = async () => {
		if (auth.isAuthenticated) {
			// One purge for every persisted store, replacing the two hand-picked
			// resets that used to sit here: those cleared grid and version state but
			// left theme, sidebar, insights cost and consortium data behind, so a
			// user's preferences survived their own logout.
			clearAppStorage();
			queryClient.clear();
			auth.signoutRedirect({
				post_logout_redirect_uri: appUrl("logout?loggedOut=true"),
			});
		} else {
			const authority = window.__APP_ENV__?.VITE_KEYCLOAK_URL;
			try {
				await assertOidcAuthorityReachable(authority);
				await auth.signinRedirect();
			} catch (error) {
				const discoveryUrl =
					isOidcAuthorityUnavailableError(error) && error.discoveryUrl
						? error.discoveryUrl
						: authority
							? oidcDiscoveryUrl(authority)
							: "";
				window.alert(
					[
						t("loginout.identity_provider_unreachable"),
						t("loginout.identity_provider_unreachable_detail", {
							error: error instanceof Error ? error.message : String(error),
						}),
						t("loginout.local_https_trust_hint"),
						discoveryUrl,
					]
						.filter(Boolean)
						.join("\n\n"),
				);
			}
		}
	};

	const { data: headerContentData, isSuccess: headerLoaded } = useQuery({
		queryKey: ["consortiaKeyInfo"],
		enabled: auth.isAuthenticated,
		throwOnError: false,
		queryFn: () =>
			gqlClient.request<any, LoadConsortiumHeaderQueryVariables>(
				getConsortiumBasics,
				{
					order: "name",
					orderBy: "ASC",
				},
			),
	});

	const consortium = headerContentData?.consortia?.content?.[0];

	// Sync consortium store state if data changes.
	//
	// The cached copy exists for the SIGNED-OUT screens: the logout page says "your DCB
	// Admin for {consortium} session has ended" and has no token left to ask with, which
	// is why consortium-storage is exempt from the sign-out purge.
	//
	// That exemption assumed a consortium always exists. It does not: one can be deleted,
	// or a deployment rebuilt. This effect only ever WROTE - on absence it did nothing at
	// all - so a name outlived the record it described, survived sign-out by design, and
	// no sequence of actions in the application could clear it. Hence the else.
	useEffect(() => {
		// Only once the query has actually answered. A transient failure or the first
		// render must not blank the branding - "we have not asked yet" and "there is none"
		// are different facts and only the second one means anything.
		if (headerLoaded && !consortium) {
			resetConsortiumStore();
			return;
		}

		if (consortium && consortium.displayName !== displayName) {
			setName(consortium.name);
			setDisplayName(consortium.displayName);
			setDescription(consortium.description);
			setCatalogueSearchURL(consortium.catalogueSearchUrl);
			setWebsiteURL(consortium.websiteUrl);
			// The merged brand columns (V9_0_004). A consortium's mark is one asset that
			// CSS sizes per app, not a separate column per app.
			setHeaderImageURL(consortium.brandHeaderIconUrl ?? "");
			if (!isEmpty(consortium.brandLogoUrl)) {
				setAboutImageURL(consortium.brandLogoUrl);
			}
		}
	}, [
		consortium,
		displayName,
		headerLoaded,
		resetConsortiumStore,
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
									"&.Mui-focusVisible": {
										outlineColor: "primary.loginButtonOutlineColor",
									},
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
