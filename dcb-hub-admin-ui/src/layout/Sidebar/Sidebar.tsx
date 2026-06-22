import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "@tanstack/react-router";
import { styled, Theme, CSSObject, useTheme } from "@mui/material/styles";
import {
	Drawer as MuiDrawer,
	List,
	Divider,
	IconButton,
	ListItem,
	ListItemButton,
	ListItemIcon,
	ListItemText,
	useMediaQuery,
} from "@mui/material";
import {
	LocationOn,
	Menu as MenuIcon,
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
	ChevronLeft,
} from "@mui/icons-material";

import Link from "@components/Link/Link";

const drawerWidth = 240;

const openedMixin = (theme: Theme): CSSObject => ({
	backgroundColor: theme.palette.primary.sidebar,
	width: drawerWidth,
	position: "static",
	height: "100%",
	border: "0px",
	transition: theme.transitions.create("width", {
		easing: theme.transitions.easing.sharp,
		duration: theme.transitions.duration.enteringScreen,
	}),
	overflowX: "hidden",
});

const closedMixin = (theme: Theme): CSSObject => ({
	transition: theme.transitions.create("width", {
		easing: theme.transitions.easing.sharp,
		duration: theme.transitions.duration.leavingScreen,
	}),
	overflowX: "hidden",
	width: `calc(${theme.spacing(7)} + 1px)`,
	[theme.breakpoints.up("sm")]: {
		width: `calc(${theme.spacing(8)} + 1px)`,
	},
});

const DrawerHeader = styled("div")(({ theme }) => ({
	display: "flex",
	alignItems: "center",
	justifyContent: "flex-end",
	padding: theme.spacing(0, 1),
	...theme.mixins.toolbar,
}));

const Drawer = styled(MuiDrawer, {
	shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
	width: drawerWidth,
	flexShrink: 0,
	whiteSpace: "nowrap",
	boxSizing: "border-box",
	...(open && {
		...openedMixin(theme),
		"& .MuiDrawer-paper": openedMixin(theme),
	}),
	...(!open && {
		...closedMixin(theme),
		"& .MuiDrawer-paper": closedMixin(theme),
	}),
}));

const SidebarIcon = (indexVal: number, isSelected: boolean) => {
	const sx = { color: isSelected ? "white" : "inherit" };
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
];

// still needs serious improvement. now we are seeing dupes
export default function Sidebar(props: any) {
	const { t } = useTranslation();
	const theme = useTheme();
	const location = useLocation();
	const isMobile = useMediaQuery(theme.breakpoints.down("md"));
	const [selected, setSelected] = useState(-1);
	const [isDisabled, setDisabled] = useState(-1);
	const [isChildPage, setChildPage] = useState(false);

	useEffect(() => {
		const currentRoute = location.pathname;
		const currentIndex = routes.findIndex(
			(route) => route.path === currentRoute,
		);
		const isExactRoute = currentIndex !== -1;

		const homeRemovedFromArray = routes.slice(1);
		const parentIndex = homeRemovedFromArray.findIndex((route) =>
			currentRoute.startsWith(route.path),
		);
		const isChildRoute = parentIndex !== -1;

		if (isChildRoute && !isExactRoute) {
			setChildPage(true);
			setSelected(parentIndex + 1);
		} else {
			setChildPage(false);
			setSelected(currentIndex);
		}
		setDisabled(currentIndex);
	}, [location.pathname]);

	const handleListButtonClick = useCallback((index: number) => {
		setSelected(index);
		setDisabled(index);
	}, []);

	return (
		<>
			{props.openStateOpen && (
				<Drawer
					variant={isMobile ? "temporary" : "permanent"}
					open={props.openStateOpen}
					onClose={props.openStateFuncClosed} // Required for temporary drawers to close when clicking outside
					ModalProps={{
						keepMounted: true, // Better open performance on mobile.
					}}
				>
					{/* <DrawerHeader /> */}
					<Divider />
					<List component="nav" data-tid="sidebar">
						{routes.map((route, index) => (
							<ListItem
								key={route.path}
								disablePadding
								sx={{ display: "block" }}
							>
								<ListItemButton
									component={Link}
									to={route.path}
									selected={selected === index}
									onClick={() => handleListButtonClick(index)}
									disabled={isDisabled === index}
									aria-current={
										!isChildPage && selected === index ? "page" : undefined
									}
									sx={{
										minHeight: 48,
										justifyContent: props.openStateOpen ? "initial" : "center",
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
									<ListItemIcon
										sx={{
											minWidth: 0,
											mr: props.openStateOpen ? 3 : "auto",
											justifyContent: "center",
										}}
									>
										{SidebarIcon(index, selected === index)}
									</ListItemIcon>
									<ListItemText
										primary={t(route.translationKey)}
										sx={{ opacity: props.openStateOpen ? 1 : 0 }}
										primaryTypographyProps={{
											fontWeight: selected === index ? "bold" : "normal",
										}}
									/>
								</ListItemButton>
							</ListItem>
						))}
					</List>
				</Drawer>
			)}
		</>
	);
}
