import getConfig from 'next/config'

const { serverRuntimeConfig, publicRuntimeConfig } = getConfig();


// https://github.com/keycloak/keycloak-documentation/blob/main/securing_apps/topics/oidc/java/logout.adoc
export default (req:any, res:any) => { 
  console.log("federatedLogout %o %o",req,res);
  // const host = encodeURIComponent(window.location);
  if ( typeof window !== "undefined" && window.location.origin ) {
    const origin = encodeURIComponent(window.location.origin+'/');
    const callback_url = publicRuntimeConfig.KEYCLOAK_ISSUER+'/protocol/openid-connect/logout?redirect_uri='+origin;
    // https://www.keycloak.org/2022/04/keycloak-1800-released - redirect_uri='+origin removed
    // replaced with post_logout_redirect_uri + id_token_hint
    console.log("redirecting to %s",callback_url);
    window.location.replace(callback_url);
  }
}
