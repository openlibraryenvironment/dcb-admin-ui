import { Breadcrumbs as MUIBreadcrumbs, Typography, useTheme } from "@mui/material"
import { MdArrowForwardIos } from 'react-icons/md';
import Link from "@components/Link/Link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
//localisation
import { useTranslation } from 'next-i18next';

type BreadcrumbType = {
    href: string;
    isCurrent: boolean;
    translationKey: string;
};

export default function Breadcrumbs () {
    const router = useRouter();
    const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbType[]>([]);
  
    useEffect(() => {
      const pathWithoutQuery = router.asPath.split("?")[0];
      let pathArray = pathWithoutQuery.split("/");
      pathArray.shift();
  
      pathArray = pathArray.filter((path) => path !== "");
  
      const breadcrumbs: BreadcrumbType[] = pathArray.map((path, index) => {
        const href = "/" + pathArray.slice(0, index + 1).join("/");
        return {
          href,
          isCurrent: index === pathArray.length - 1,
          translationKey: getTranslationKey(pathArray.slice(0, index + 1))
        };
      });
      setBreadcrumbs(breadcrumbs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // Disabled because getTranslationKey is a stable function and will not change.
    }, [router.asPath]);

    const { t } = useTranslation();
    const theme = useTheme(); 

    const getTranslationKey = (pathArray: string[]): string => {
      // This function formulates the correct translation key from the pathArray.
      // For nested keys (like circulation status mappings) we just need to use .join
      const nestedKey = pathArray.join('.');
      // However top-level keys need to be addressed differently as in some cases they have the same name as the objects
      // i.e 'mappings' must become 'mappings.name' so it references a specific key and not the object.
      const topLevelKey = pathArray[0];
      // Check if the nestedKey is equal to the topLevelKey,
      // if true, return only the topLevel key - if not, return a nested key.
      if (nestedKey === topLevelKey)
      {
        // Handle the issue with 'mappings' and 'settings' and any other keys that need the '.name' suffix.
        switch(topLevelKey)
        {
          case "mappings":
          case "settings":
            return "nav."+topLevelKey+".name";
          default:
            return "nav."+topLevelKey;
          }
      }
      else
      {
        // Check for UUIDs and ensure they are not translated. 
        // As all UUIDs must be 36 characters, we can apply a length check here.
        // A UUID type check would be better, but is not available in the pathArray as everything is stored as a string.
        if (pathArray.slice(-1)[0].length == 36)
        {
          // UUID found, do not translate.
          // UUIDs will also always be nested keys which is why this check works.
          return pathArray.slice(-1)[0];
        }
        else
        {
          // Check for audits: the key is formulated slightly differently due to the URL
          if(nestedKey == "patronRequests.audits")
          {
            return "nav.auditLog";
          }
          // Not a UUID, formulate the translation key.
          return "nav."+nestedKey
        }
      }
    };

    //this is used to either set the breadcrumb as a link if it is the last breadcrumb.
    const mapBreadcrumbs = () => {
      return(
        breadcrumbs?.map((breadcrumb, index) => (
      // check if the breadcrumb is not the last item in the array.
      index < breadcrumbs.length - 1 ? (
        // check if breadcrumb.href is defined and not null for the key.
        // this is to get around build issues with the key value.
        // performs if breadcrumbs is last in the array.
        // This also checks for the audit log key nd unsets the link, because there is no /audits page to link to
        breadcrumb.href && breadcrumb.translationKey!= "nav.auditLog" ? (
          <Link sx={{color: theme.palette.primary.breadcrumbs, textWrap: 'wrap'}} underline="hover" key={breadcrumb.href} href={breadcrumb.href}>
            {t(breadcrumb.translationKey)}
          </Link>
        ) : (
          // if it is null then use index as the key.
          <Typography sx={{color: theme.palette.primary.breadcrumbs,textWrap: 'wrap'}} key={index}>
            {t(breadcrumb.translationKey)}
          </Typography>
        )
      ) : (
        // renders if the breadcrumb is the last item.
        <Typography sx={{color: theme.palette.primary.breadcrumbs, textWrap: 'wrap'}} key={breadcrumb.href}>
          {breadcrumb.translationKey.length == 36 ? breadcrumb.translationKey : t(breadcrumb.translationKey)}
        </Typography>
      )
    ))
      )
    };

    return (
        <MUIBreadcrumbs sx={{pl:3, pr:3}} separator={<MdArrowForwardIos/>}>
          {/* Check if we're on the home page - if we are, unset the 'Home' link */}
          {/* Breadcrumb length will always be 0 on the home page as it is at the base URL */}
          {breadcrumbs.length == 0 ? <Typography sx={{color: theme.palette.primary.breadcrumbs,textWrap: 'wrap'}}>
          {t("nav.home")} </Typography> : <Link sx={{color: theme.palette.primary.breadcrumbs, textWrap: 'wrap'}} underline="hover" href="/">{t("nav.home")}</Link>}
          {mapBreadcrumbs()};
        </MUIBreadcrumbs>
    )
} 