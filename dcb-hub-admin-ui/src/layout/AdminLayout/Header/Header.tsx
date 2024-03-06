import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import { MdMenu } from "react-icons/md";
import { MdAccountCircle } from "react-icons/md";
import Link from '@components/Link/Link';
import { signIn, signOut, useSession } from "next-auth/react"
import { styled, useTheme } from '@mui/material/styles';
import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';
import { useTranslation } from 'next-i18next'
import { Button } from "@mui/material";
import consortiumLogo from 'public/assets/brand/MOBIUS_Mark x36.jpg';
import Image from "next/image";
import { useRouter } from "next/router";

interface AppBarProps extends MuiAppBarProps {
  open?: boolean;
}
interface HeaderProps {
	openStateFuncClosed?: any;
  iconsVisible?: boolean;
}

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})<AppBarProps>(({ theme}) => ({
  zIndex: theme.zIndex.drawer + 1,
}));

export default function Header({openStateFuncClosed, iconsVisible}: HeaderProps) {
  const { status } = useSession()
  const theme = useTheme();
  const router = useRouter();
  const url = "/auth/logout";
  const { t } = useTranslation();
  const handleClick = () => {
    if (status === "authenticated")
    {
      signOut({redirect: false})
      router.push(url)
    }
    else {
      signIn()
    }
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="fixed" sx={{backgroundColor: theme.palette.primary.header}}>
        {/* this width is the maxSize of the content */}
        <Toolbar sx={{ maxWidth: '1400px', alignSelf: 'center', width: '100%'}}>
          {/* This code handles the display of the consortium icon and sidebar icon.
          By using iconsVisible, we can render the correct UI for the situation  */}
          {iconsVisible!= false ?
          <Box>
              <IconButton
                data-tid="sidebar-menu"
                size="large"
                edge="start"
                aria-label="menu"
                onClick={openStateFuncClosed}
                sx={{ mr: 2, color: theme.palette.primary.headerText}}
              >
                <MdMenu size={20}/>
              </IconButton> 
          </Box>
          : null}
          {/* Render just the image if other header icons are visible, 
              or the image and additional padding if the icons have been hidden. */}
          {iconsVisible!= false ? 
            <Image
              src={consortiumLogo}
              alt={t("header.consortium.alt", {consortium: "MOBIUS"})}
            /> :  
            <Box sx={{ml: 3, mt: 1 }}>
              <Image
                src={consortiumLogo}
                alt={t("header.consortium.alt", {consortium: "MOBIUS"})}
              />
            </Box>
          }
          <Typography data-tid="header-title" variant="h1" component="div" sx={{ color: theme.palette.primary.headerText, fontWeight: 'bold', flexGrow: 1, pl: 2}}>
            {t("app.title", {consortium_name: "MOBIUS"})}
          </Typography>
          <div>
            {iconsVisible!= false ? <Link href='/profile'>
                <IconButton
                size="large"
                data-tid="profile-button"
                aria-label="account of current user"
                sx={{ color: theme.palette.primary.headerText}}
                >
                <MdAccountCircle size={20}/>
                </IconButton>  
            </Link> : null}
            {iconsVisible!= false ? <Button
              data-tid="login-button"
              aria-label={(status === "authenticated" ? "Logout": "Login")}
              onClick={handleClick}
              sx={{ color: theme.palette.primary.headerText}}
              >
                {(status === "authenticated" ? t("nav.logout"): t("nav.login"))}
            </Button> : null }
          </div>
        </Toolbar>
      </AppBar>
    </Box>
  );
}
