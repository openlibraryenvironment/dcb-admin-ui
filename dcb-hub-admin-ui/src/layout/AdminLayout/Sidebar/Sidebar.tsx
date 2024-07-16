import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "next-i18next";
import {
	styled,
	Theme,
	CSSObject,
	useTheme,
	lighten,
	darken,
} from "@mui/material/styles";
import MuiDrawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Link from "@components/Link/Link";
import { useRouter } from "next/router";
import {
	MdLocationOn,
	MdMenu,
	MdSettings,
	MdBook,
	MdHome,
	MdOutput,
	MdDns,
	MdAccountBalance,
	MdWorkspaces,
	MdMap,
	MdInfo,
	MdLocalLibrary,
} from "react-icons/md";

const drawerWidth = 240;

const openedMixin = (theme: Theme): CSSObject => ({
	backgroundColor: theme.palette.primary.sidebar,
	width: drawerWidth,
	// use position: 'static' to fix issue of sidebar not being centred
	position: "static",
	height: "100%",
	border: "0px", // disable border inherited from material ui drawer
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
	// necessary for content to be below app bar
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

const SidebarIcon = (indexVal: any, isSelected: boolean) => {
	const iconProps = { size: 20, color: isSelected ? "white" : "inherit" };
	switch (indexVal) {
		case 0:
			return <MdHome {...iconProps} />;
		case 1:
			return <MdOutput {...iconProps} />;
		case 2:
			return <MdAccountBalance {...iconProps} />;
		case 3:
			return <MdDns {...iconProps} />;
		case 4:
			return <MdLocationOn {...iconProps} />;
		case 5:
			return <MdWorkspaces {...iconProps} />;
		case 6:
			return <MdBook {...iconProps} />;
		case 7:
			return <MdLocalLibrary {...iconProps} />;
		case 8:
			return <MdMap {...iconProps} />;
		case 9:
			return <MdSettings {...iconProps} />;
		case 10:
			return <MdInfo {...iconProps} />;
		default:
			return null;
	}
};

type routes = {
	path: string;
	translationKey: string;
};

const routes = [
	{ path: "/", translationKey: "nav.home" },
	{ path: "/patronRequests", translationKey: "nav.patronRequests" },
	{ path: "/agencies", translationKey: "nav.agencies" },
	{ path: "/hostlmss", translationKey: "nav.hostlmss" },
	{ path: "/locations", translationKey: "nav.locations" },
	{ path: "/groups", translationKey: "nav.groups" },
	{ path: "/bibs", translationKey: "nav.bibs" },
	{ path: "/libraries", translationKey: "nav.libraries" },
	{ path: "/mappings", translationKey: "nav.mappings.name" },
	{ path: "/serviceInfo", translationKey: "nav.serviceInfo.name" },
	// currently unused, may be un-commented in the future
	//{path: '/settings', translationKey: 'nav.settings.name'}
];

export default function Sidebar(props: any) {
	const { t } = useTranslation();
	const theme = useTheme();
	const router = useRouter();
	const [selected, setSelected] = useState(-1);
	const [isDisabled, setDisabled] = useState(-1);
	const [isChildPage, setChildPage] = useState(false);

	// for maintaining highlight and disabled on button, on re-renders
	useEffect(() => {
		const currentRoute = router.pathname;
		/*
      checks if any path value in the roots array is equal to the currentRoute,
      returns -1 if not.
    */
		const currentIndex = routes.findIndex(
			(route) => route.path === currentRoute,
		);
		// checks if any value in the array exactly matches the path
		const isExactRoute = routes.some((route) => route.path === currentRoute);
		// to dismiss '/' from counting as a parent page
		const homeRemovedFromArray = routes.slice(1);
		const isChildRoute = homeRemovedFromArray.some((route) =>
			currentRoute.startsWith(route.path),
		);

		if (isChildRoute && !isExactRoute) {
			const parentIndex = homeRemovedFromArray.findIndex((route) =>
				currentRoute.startsWith(route.path),
			);

			setChildPage(true);
			setSelected((prev) => (parentIndex !== -1 ? parentIndex : prev) + 1);
		}

		/*
      keep unchanged if the route is not found in the array
    */
		setSelected((prev) => (currentIndex !== -1 ? currentIndex : prev));
		setDisabled((prev) => (currentIndex !== -1 ? currentIndex : prev));
	}, [router.pathname]);

	const handleListButtonClick = useCallback((index: number) => {
		setSelected(index);
		setDisabled(index);
	}, []);

	return (
		<>
			{props.openStateOpen && (
				<Drawer variant="permanent" open={props.openStateOpen}>
					{props.openStateOpen && (
						<DrawerHeader>
							<IconButton
								color="inherit"
								aria-label="open drawer"
								onClick={props.openStateFuncClosed}
								edge="start"
								sx={{
									mr: "auto",
									minWidth: 0,
									ml: 0.65,
								}}
							>
								<MdMenu />
							</IconButton>
						</DrawerHeader>
					)}
					<Divider />
					<List component="nav" data-tid="sidebar">
						{routes.map((route, index) => (
							<ListItem
								id={t(route.translationKey.replace(/\s/g, ""))}
								key={t(route.translationKey)}
								component="nav"
								disablePadding
								sx={{ display: "block" }}
							>
								<ListItemButton
									LinkComponent={Link}
									href={route.path}
									selected={selected === index}
									onClick={() => handleListButtonClick(index)}
									disabled={isDisabled === index}
									aria-current={
										isChildPage
											? undefined
											: selected === index
												? "page"
												: undefined
									}
									sx={{
										minHeight: 48,
										justifyContent: props.openStateOpen ? "initial" : "center",
										px: "24px",
										":hover": {
											backgroundColor:
												theme.palette.mode === "light"
													? darken(theme.palette.primary.sidebar, 0.08)
													: lighten(theme.palette.primary.sidebar, 0.16),
										},
										":active": {
											backgroundColor:
												theme.palette.mode === "light"
													? darken(theme.palette.primary.sidebar, 0.16)
													: lighten(theme.palette.primary.sidebar, 0.24),
										},
										"&.Mui-selected": {
											backgroundColor: isChildPage
												? theme.palette.primary.buttonForSelectedChildPage
												: theme.palette.primary.buttonForSelectedPage,
											color: theme.palette.primary.selectedText,
											// overrides the default focus styles applied by component
											"&.Mui-focusVisible": {
												backgroundColor: isChildPage
													? theme.palette.primary.buttonForSelectedChildPage
													: theme.palette.primary.buttonForSelectedPage,
											},
										},
										"&.Mui-disabled": {
											opacity: "100",
										},
									}}
									data-tid={t(route.translationKey) + " button"}
								>
									<ListItemIcon
										onClick={props.openStateFuncOpen}
										sx={{
											minWidth: 0,
											mr: props.openStateOpen ? 3 : "auto",
											justifyContent: "center",
										}}
										data-tid={t(route.translationKey) + " icon"}
									>
										{SidebarIcon(index, selected === index)}
									</ListItemIcon>
									<ListItemText
										primary={t(route.translationKey)}
										sx={{ opacity: props.openStateOpen ? 1 : 0 }}
										primaryTypographyProps={{
											fontWeight: selected === index ? "bold" : "normal",
										}}
										data-tid={t(route.translationKey) + " text"}
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
