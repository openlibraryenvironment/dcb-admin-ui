import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "@tanstack/react-router";
import {
	Drawer,
	List,
	Divider,
	ListItem,
	ListItemButton,
	ListItemIcon,
	ListItemText,
} from "@mui/material";
import {
	LocationOn,
	Settings,
	Book,
	Home,
	Output,
	Dns,
	AccountBalance,
	Workspaces,
	Map,
	Info,
	LocalLibrary,
	Search,
	Insights,
} from "@mui/icons-material";

import Link from "@components/Link/Link";
import { isInsightsEnabled } from "@helpers/featureFlags";

const drawerWidth = 240;

const SidebarIcon = (indexVal: number, isSelected: boolean) => {
	const sx = { color: isSelected ? "primary.selectedText" : "inherit" };
	switch (indexVal) {
		case 0:
			return <Home fontSize="small" sx={sx} />;
		case 1:
			return <Output fontSize="small" sx={sx} />;
		case 2:
			return <Settings fontSize="small" sx={sx} />;
		case 3:
			return <LocalLibrary fontSize="small" sx={sx} />;
		case 4:
			return <AccountBalance fontSize="small" sx={sx} />;
		case 5:
			return <Dns fontSize="small" sx={sx} />;
		case 6:
			return <Workspaces fontSize="small" sx={sx} />;
		case 7:
			return <LocationOn fontSize="small" sx={sx} />;
		case 8:
			return <Map fontSize="small" sx={sx} />;
		case 9:
			return <Book fontSize="small" sx={sx} />;
		case 10:
			return <Search fontSize="small" sx={sx} />;
		case 11:
			return <Info fontSize="small" sx={sx} />;
		case 12:
			return <Insights fontSize="small" sx={sx} />;
		default:
			return null;
	}
};

const routes = [
	{ path: "/", translationKey: "nav.home" },
	{
		path: "/patronRequests/exception",
		translationKey: "nav.patronRequests.name",
	},
	{ path: "/consortium", translationKey: "nav.consortium.name" },
	{ path: "/libraries", translationKey: "nav.libraries.name" },
	{ path: "/agencies", translationKey: "nav.agencies" },
	{ path: "/hostlmss", translationKey: "nav.hostlmss" },
	{ path: "/groups", translationKey: "nav.groups.name" },
	{ path: "/locations", translationKey: "nav.locations" },
	{ path: "/mappings", translationKey: "nav.mappings.name" },
	{ path: "/bibs", translationKey: "nav.bibs" },
	{ path: "/search", translationKey: "nav.search.name" },
	{ path: "/serviceInfo", translationKey: "nav.serviceInfo.name" },
	{ path: "/consortium/insights", translationKey: "nav.consortium.insights" },
];

interface SidebarProps {
	// Below `md`: temporary overlay controlled by `mobileOpen`.
	// At `md`+: permanently docked, shown/hidden by `desktopOpen` (no mini rail).
	isMobile: boolean;
	mobileOpen: boolean;
	desktopOpen: boolean;
	onClose: () => void;
}

export default function Sidebar({
	isMobile,
	mobileOpen,
	desktopOpen,
	onClose,
}: SidebarProps) {
	const { t } = useTranslation();
	const location = useLocation();

	// Insights is gated on a dcb-service release that is not out yet. Filtered at
	// render rather than removed from `routes`, because the icon lookup and the
	// selection logic below are index-based - and since Insights is the last
	// entry, dropping it shifts nothing.
	const visibleRoutes = useMemo(
		() =>
			isInsightsEnabled()
				? routes
				: routes.filter((route) => route.path !== "/consortium/insights"),
		[],
	);

	// Selection state is derived entirely from the current URL - deliberately
	// not mirrored into component state (which previously caused it to
	// briefly desync from the URL via an optimistic click handler + a
	// separate effect, producing duplicate/incorrect highlighting).
	const { selected, isChildPage, disabledIndex } = useMemo(() => {
		const currentRoute = location.pathname;
		const exactIndex = visibleRoutes.findIndex(
			(route) => route.path === currentRoute,
		);

		if (exactIndex !== -1) {
			return {
				selected: exactIndex,
				isChildPage: false,
				disabledIndex: exactIndex,
			};
		}

		const homeRemovedFromArray = visibleRoutes.slice(1);
		const parentIndex = homeRemovedFromArray.findIndex((route) =>
			currentRoute.startsWith(route.path),
		);

		if (parentIndex !== -1) {
			return {
				selected: parentIndex + 1,
				isChildPage: true,
				disabledIndex: -1,
			};
		}

		return { selected: -1, isChildPage: false, disabledIndex: -1 };
	}, [location.pathname, visibleRoutes]);

	const navigation = (
		<List
			component="nav"
			id="main-sidebar-nav"
			aria-label={String(t("nav.main_menu"))}
			data-tid="sidebar"
		>
			{visibleRoutes.map((route, index) => (
				<ListItem key={route.path} disablePadding sx={{ display: "block" }}>
					<ListItemButton
						component={Link}
						to={route.path}
						selected={selected === index}
						disabled={disabledIndex === index}
						// On mobile, choosing a destination dismisses the overlay.
						onClick={isMobile ? onClose : undefined}
						aria-current={
							!isChildPage && selected === index ? "page" : undefined
						}
						sx={{
							minHeight: 48,
							px: "24px",

							":hover": { backgroundColor: "primary.hover" },
							":active": { backgroundColor: "primary.hover" },

							"&.Mui-selected": {
								backgroundColor: isChildPage
									? "primary.buttonForSelectedChildPage"
									: "primary.buttonForSelectedPage",
								color: "primary.selectedText",
								"&.Mui-focusVisible": {
									backgroundColor: isChildPage
										? "primary.buttonForSelectedChildPage"
										: "primary.buttonForSelectedPage",
								},
								":hover": {
									backgroundColor: isChildPage
										? "primary.hoverOnSelectedPage"
										: "primary.buttonForSelectedPage",
								},
							},
							"&.Mui-disabled": { opacity: 1 },
						}}
					>
						<ListItemIcon sx={{ minWidth: 0, mr: 3, justifyContent: "center" }}>
							{SidebarIcon(index, selected === index)}
						</ListItemIcon>
						<ListItemText
							primary={t(route.translationKey)}
							slotProps={{
								primary: {
									sx: {
										fontWeight: selected === index ? "bold" : "normal",
									},
								},
							}}
						/>
					</ListItemButton>
				</ListItem>
			))}
		</List>
	);

	if (isMobile) {
		return (
			<Drawer
				variant="temporary"
				open={mobileOpen}
				onClose={onClose}
				ModalProps={{ keepMounted: true }} // Better open performance on mobile.
				sx={{
					"& .MuiDrawer-paper": {
						width: drawerWidth,
						boxSizing: "border-box",
						backgroundColor: "primary.sidebar",
						border: 0,
						// Clear the fixed 70px Header and scroll if items overflow.
						pt: "70px",
						overflowY: "auto",
					},
				}}
			>
				<Divider />
				{navigation}
			</Drawer>
		);
	}

	// Desktop/tablet: docked drawer, toggled fully in/out (never a mini rail).
	// Unmounting when hidden keeps hidden nav links out of the tab order (WCAG).
	if (!desktopOpen) return null;

	return (
		<Drawer
			variant="permanent"
			sx={{
				width: drawerWidth,
				flexShrink: 0,
				"& .MuiDrawer-paper": {
					position: "static",
					width: drawerWidth,
					height: "100%",
					boxSizing: "border-box",
					backgroundColor: "primary.sidebar",
					border: 0,
					overflowX: "hidden",
				},
			}}
		>
			<Divider />
			{navigation}
		</Drawer>
	);
}
