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
  const { data: session, status } = useSession()
  const theme = useTheme();
  const { t } = useTranslation();
  const handleClick = () => {
    if (status === "authenticated")
    {
      signOut()
    }
    else {
      signIn()
    }

  }

  return (
            <Box sx={{ flexGrow: 1 }}>
              <AppBar position="fixed" sx={{backgroundColor: theme.palette.primary.header}}>
                <Toolbar>
                  <IconButton
                    size="large"
                    edge="start"
                    aria-label="menu"
                    onClick={props.openStateFuncClosed}
                    sx={{ mr: 2, color: theme.palette.primary.headerText}}
                  >
                    <MdMenu size={20}/>
                  </IconButton>
                  <Typography variant="h1" component="div" sx={{ color: theme.palette.primary.headerText, fontWeight: 'bold', flexGrow: 1 }}>
                  {t("header.title")}
                  </Typography>
                  {/*
                  Temporarily disabled as it is not currently needed due
                  to lack of other languages, but may be needed in the future

                  <LanguageSwitcher/>
                  */}                  
                  <div>
                    <Link href='/profile'
                      style={{ color: 'inherit' }}>
                        <IconButton
                        size="large"
                        aria-label="account of current user"
                        sx={{ color: theme.palette.primary.headerText}}
                        >
                        <MdAccountCircle size={20}/>
                        </IconButton>  
                    </Link>
                    
                    <Button
                      aria-label={(status === "authenticated" ? "Logout": "Login")}
                      onClick={handleClick}
                      sx={{ color: theme.palette.primary.headerText}}
                      >
                        {(status === "authenticated" ? "Logout" : "Login")}
                    </Button>
                  </div>
                </Toolbar>
              </AppBar>
          </Box>
  );
}
