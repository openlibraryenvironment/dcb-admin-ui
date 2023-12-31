import { styled, Theme, CSSObject } from '@mui/material/styles';
import MuiDrawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Link from '@components/Link/Link';
import
{ MdLocationOn, 
  MdSpaceDashboard, 
  MdMenu,
  MdGroup,
  MdSettings,
  MdBook,
  MdHome,
  MdOutput,
  MdDns,
  MdAccountBalance,
  MdWorkspaces
}from 'react-icons/md';
import { useMediaQuery } from '@mui/material';
import Breadcrumbs from '../Breadcrumbs/Breadcrumbs';
//localisation
import { useTranslation } from 'next-i18next';

const drawerWidth = 240;

const openedMixin = (theme: Theme): CSSObject => ({
  width: drawerWidth,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
});

const closedMixin = (theme: Theme): CSSObject => ({
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: 'hidden',
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up('sm')]: {
    width: `calc(${theme.spacing(8)} + 1px)`,
  },
});

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
}));

const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    width: drawerWidth,
    flexShrink: 0,
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    ...(open && {
      ...openedMixin(theme),
      '& .MuiDrawer-paper': openedMixin(theme),
    }),
    ...(!open && {
      ...closedMixin(theme),
      '& .MuiDrawer-paper': closedMixin(theme),
    }),
  }),
);

export default function Sidebar(props:any) {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const { t } = useTranslation();

  return (
    <>
          {props.openStateOpen && (

      <Drawer 
      variant="permanent" open={props.openStateOpen}>
    {props.openStateOpen && (

        <DrawerHeader>
            <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={props.openStateFuncClosed}
            edge="start"
            sx={{
              mr: 'auto',
              minWidth: 0,
              ml: 0.65,
            }}
          >
            <MdMenu />
          </IconButton>
        </DrawerHeader>
         )}
         
        <Divider />
        <List component = "nav">
              {/*
                It has been decided that we do not currently want breadcrumbs in the sidebar,
                therefore this code has been temporarily disabled

                props.openStateOpen ? <ListItem key={"breadcrumbs-sidebar"} component="nav">
                <Breadcrumbs />
                  {// Hide this on toggled sidebar }
              </ListItem>: null */}
          {[t('sidebar.dashboard_page_button'), t('sidebar.patron_request_button'),
          t('sidebar.agency_button'), t('sidebar.host_lms_button'), t('sidebar.location_button'), t('sidebar.groups_button'), t('sidebar.bib_button'), t('sidebar.settings_button')].map((text, index) => (
            <Link
              style={{textDecoration: 'none', color: prefersDarkMode? 'white': '#121212'}}
              href=
              {
                index === 0 ? '/': 
                index=== 1 ? '/requests':
                index === 2 ? '/agencies':
                index === 3 ? '/hostlmss':
                index === 4 ? '/locations':
                index === 5? '/groups':
                index === 6? '/sourceBibs':
                '/settings'
              }
              key={index}
            >
            <ListItem key={text} component="nav" disablePadding sx={{ display: 'block' }}>
              <ListItemButton
                sx={{
                  minHeight: 48,
                  justifyContent: props.openStateOpen ? 'initial' : 'center',
                  px: 2.5,
                }}
              >
                <ListItemIcon
                  onClick={props.openStateFuncOpen}
                  sx={{
                    minWidth: 0,
                    mr: props.openStateOpen ? 3 : 'auto',
                    justifyContent: 'center',
                  }}
                >
                    {index === 0 ? <MdHome size={20} /> : index === 1 ? <MdOutput size={20} /> :
                      index === 2 ? <MdAccountBalance size={20} /> : index === 3 ? <MdDns size={20} /> :
                        index === 4 ? <MdLocationOn size={20} /> : index === 6 ? <MdBook size={20} /> :
                          index === 7 ? <MdSettings size={20} /> : <MdWorkspaces size={20} />
                    }
                </ListItemIcon>
                <ListItemText primary={text} sx={{ opacity: props.openStateOpen ? 1 : 0 }} />
              </ListItemButton>
            </ListItem>
            </Link>
          ))}
          </List>
        <Divider />
      </Drawer>
    )}

    </>
      
  );
}

