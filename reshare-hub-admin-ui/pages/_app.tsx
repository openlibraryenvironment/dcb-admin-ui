import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { SessionProvider } from "next-auth/react"
import Layout from '../components/Layout'

export default function App({ Component, pageProps }: AppProps) {

  console.log("kcid: %s",process.env.KEYCLOAK_ID);
  console.log("issuer: %s",process.env.KEYCLOAK_ISSUER);

  return (
    <SessionProvider session={pageProps.session}>
      <Layout>
        <Component className="fluid" {...pageProps} />
      </Layout> 
    </SessionProvider>
  )
}

