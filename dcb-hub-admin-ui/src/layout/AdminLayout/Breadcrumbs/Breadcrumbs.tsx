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
          translationKey: path
        };
      });
      setBreadcrumbs(breadcrumbs);
    }, [router.asPath]);

    const { t } = useTranslation();
    const theme = useTheme(); 

    //this is used to either set the breadcrumb as a link if it is the last breadcrumb.
    const mapBreadcrumbs = () => {
      return(
        breadcrumbs?.map((breadcrumb, index) => (
      // check if the breadcrumb is not the last item in the array.
      index < breadcrumbs.length - 1 ? (
        // check if breadcrumb.href is defined and not null for the key.
        // this is to get around build issues with the key value.
        // performs if breadcrumbs is last in the array.
        breadcrumb.href ? (
          <Link sx={{color: theme.palette.primary.breadcrumbs, textWrap: 'wrap'}} underline="hover" key={breadcrumb.href} href={breadcrumb.href}>
            {t("nav."+breadcrumb.translationKey)}
          </Link>
        ) : (
          // if it is null then use index as the key.
          <Typography sx={{color: theme.palette.primary.breadcrumbs,textWrap: 'wrap'}} key={index}>
            {t("nav."+breadcrumb.translationKey)}
          </Typography>
        )
      ) : (
        // renders if the breadcrumb is the last item.
        <Typography sx={{color: theme.palette.primary.breadcrumbs, textWrap: 'wrap'}} key={breadcrumb.href}>
          {t("nav."+breadcrumb.translationKey)}
        </Typography>
      )
    ))
      )
    };

    return (
        <MUIBreadcrumbs sx={{pl:3, pr:3}} separator={<MdArrowForwardIos/>}>
          <Link sx={{color: theme.palette.primary.breadcrumbs, textWrap: 'wrap'}} href="/">{t("nav.home")}</Link>
          {mapBreadcrumbs()};
        </MUIBreadcrumbs>
    )
} 