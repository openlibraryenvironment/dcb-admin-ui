// The 'light' variant of the openRS theme.

import { createTheme } from "@mui/material";
import localFont from 'next/font/local'


// We have switched to using Next local fonts due to Next.js having issues fetching Google Fonts that were causing strange behaviour in dev mode
// See here https://github.com/vercel/next.js/issues/45080

const roboto = localFont({
    src: [
      {
        path: './fonts/Roboto-LightItalic.ttf',
        weight: '300',
        style: 'italic',
      },
      {
        path: './fonts/Roboto-Light.ttf',
        weight: '300',
        style: 'normal',
      },
      {
        path: './fonts/Roboto-Regular.ttf',
        weight: '400',
        style: 'normal',
      },
      {
        path: './fonts/Roboto-Italic.ttf',
        weight: '400',
        style: 'italic',
      },
      {
        path: './fonts/Roboto-Medium.ttf',
        weight: '500',
        style: 'normal',
      },
      {
        path: './fonts/Roboto-MediumItalic.ttf',
        weight: '500',
        style: 'italic',
      },
      {
        path: './fonts/Roboto-Bold.ttf',
        weight: '700',
        style: 'normal',
      },
      {
        path: './fonts/Roboto-BoldItalic.ttf',
        weight: '700',
        style: 'italic',
      },
    ],
  })

const openRSLight = createTheme({
    palette: {
        contrastThreshold: 4.5,
        mode: 'light',
        primary: {
            breadcrumbs: '#246F9E',
            buttonForSelectedChildPage: '#999999',
            buttonForSelectedPage: '#287BAF',
            footerArea: '#FFFFFF',
            footerText: '#000000',
            linkedFooterBackground: '#0C4068',
					  linkedFooterText: '#FFFFFF',
            header: '#0C4068',
            headerText: '#FFFFFF',
            hover: '#EEEEEE',
            hoverOnSelectedPage: '#A9A9A9',
            link: '#0C4068',
            linkText: '#246F9E',
            landingBackground: '#F9F9F9',
            landingCard: '#FFFFFF',
            loginCard: '#E2EEF6',
            loginText: '#0C4068',
            main: '#287BAF',
            selectedText: '#FFFFFF',
            sidebar: '#F6F6F6',
            titleArea:'#FFFFFF',
        },
        background: {
            default: '#FFFFFF'
        }
    },
    // Supply the font for the theme here.
    typography: {
        fontFamily: roboto.style.fontFamily,
        h1: {
            fontSize: 20,
            color: "#0C4068"
        },
        h2: {
            fontSize: 32,
            fontWeight: 400,
            color: "#0C4068"
        },
        h3: {
            fontSize: 20
        },
        h4: {
            fontSize: 18
        },
        loginCardText: {
            fontSize: 18
        },
        cardActionText: {
            fontSize: '1rem'
        },
        subheading : {
            fontSize: '1.3rem'
        },
        attributeTitle: {
            fontWeight: 'bold',
        },
        loginHeader: {
            fontSize: 32, 
            fontWeight: 'bold'
        },
        modalTitle: {
            textAlign: 'center',
            fontWeight: 'bold'
        },
        homePageText: {
            fontSize: '1.1rem'
        },
        notFoundTitle: {
            fontSize: '3rem'
        },
        notFoundText: {
            fontSize: '1.5rem'
        },
        linkedFooterTextSize: {
          fontSize: '14px'
        },
        linkedFooterHeader: {
          fontSize: 18,
          fontWeight: 'bold'
        },
    },
    components: {
        MuiButton: {
            variants: [
              {
                props: { size: 'xlarge' },
                style: {
                  padding: '14px 28px',
                  fontSize: '1.1rem'
                },
              },
            ],
          }
}});
export default openRSLight;