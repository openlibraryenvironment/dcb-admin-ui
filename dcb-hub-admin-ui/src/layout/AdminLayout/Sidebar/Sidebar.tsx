import * as React from 'react';
import { styled, Theme, CSSObject } from '@mui/material/styles';
import Box from '@mui/material/Box';
import MuiDrawer from '@mui/material/Drawer';
//import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';
//import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import CssBaseline from '@mui/material/CssBaseline';
//import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Link from 'next/link';

import
{ MdLocationOn, 
  MdSpaceDashboard, 
  MdMenu,
  MdGroup
}from 'react-icons/md';

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

/*
interface AppBarProps extends MuiAppBarProps {
  open?: boolean;
}

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})<AppBarProps>(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));*/

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

export default function Sidebar() {
  const [open, setOpen] = React.useState(true);

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      {/*
      <AppBar position="fixed" sx={{bgcolor: "#3c4b64;"}}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={()=>{setOpen(!open)}}
            edge="start"
            sx={{
              marginRight: 5
            }}
          >
            <MdMenu />
          </IconButton>
          <Typography variant="h6" noWrap component="div" >
            DCB Admin UI
          </Typography>
        </Toolbar>
      </AppBar>
          */}
      <Drawer 
      variant="permanent"  open={open}>
        <DrawerHeader>
            <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={()=>{setOpen(!open)}}
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
        <Divider />
        <List>
          {['Dashboard', 'Patron Request', 'Agency', 'Host LMS', 'Location', 'Groups'].map((text, index) => (
            <Link
              style={{textDecoration: 'none', color: '#363a3d'}}
              href=
              {
                index === 0 ? '/': 
                index=== 1? '/requests':
                index === 2 ? '/agencies':
                index === 3 ? '/hostlmss':
                index === 4 ? '/locations':
                '/groups'
              }
              key={index}
            >
            <ListItem key={text} disablePadding sx={{ display: 'block' }}>
              <ListItemButton
                sx={{
                  minHeight: 48,
                  justifyContent: open ? 'initial' : 'center',
                  px: 2.5,
                }}
              >
                <ListItemIcon
                  onClick={()=>{setOpen(open)}}
                  sx={{
                    minWidth: 0,
                    mr: open ? 3 : 'auto',
                    justifyContent: 'center',
                  }}
                >
                  {
                  index === 0 ? <MdSpaceDashboard/>: index === 1 ? <MdSpaceDashboard />: 
                  index === 2 ? <MdSpaceDashboard/>: index === 3 ? <MdSpaceDashboard/>:
                  index === 4 ? <MdLocationOn/>: <MdGroup/>
                  }
                </ListItemIcon>
                <ListItemText primary={text} sx={{ opacity: open ? 1 : 0 }} />
              </ListItemButton>
            </ListItem>
            </Link>

          ))}
        </List>
        <Divider />
      </Drawer>
    </Box>
  );
}
