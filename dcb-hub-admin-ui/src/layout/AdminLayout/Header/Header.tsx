import * as React from "react";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import { MdLogout, MdMenu } from "react-icons/md";
import { MdAccountCircle } from "react-icons/md";
import Link from '@components/Link/Link';
import { signOut } from "next-auth/react"
import { styled } from '@mui/material/styles';
import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';
import { useTranslation } from 'next-i18next'
//import LanguageSwitcher from "./LanguageSwitcher";

interface AppBarProps extends MuiAppBarProps {
  open?: boolean;
}

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})<AppBarProps>(({ theme}) => ({
  zIndex: theme.zIndex.drawer + 1,
}));

export default function Header(props:any) {

  const { t } = useTranslation();

  return (
            <Box sx={{ flexGrow: 1 }}>
              <AppBar position="fixed">
                <Toolbar>
                  <IconButton
                    size="large"
                    edge="start"
                    color="inherit"
                    aria-label="menu"
                    onClick={props.openStateFuncClosed}
                    sx={{ mr: 2 }}
                  >
                    <MdMenu size={20}/>
                  </IconButton>
                  <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                  {t("header.title", "DCB Admin UI")}
                  </Typography>
                  {/*<LanguageSwitcher/>*/}                  
                  <div>
                    <Link href='/profile'
                      style={{ color: 'inherit' }}>
                        <IconButton
                        size="large"
                        aria-label="account of current user"
                        color="inherit"
                        >
                        <MdAccountCircle size={20}/>
                        </IconButton>  
                    </Link>

                    <IconButton
                      size="large"
                      aria-label="sign out"
                      aria-haspopup="true"
                      onClick={()=>signOut()}
                      color="inherit"
                      >
                    <MdLogout size={20}/>
                    </IconButton>
                  </div>
                </Toolbar>
              </AppBar>
          </Box>
  );
}