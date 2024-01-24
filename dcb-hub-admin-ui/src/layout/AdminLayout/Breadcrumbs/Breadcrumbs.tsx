import { Breadcrumbs as MUIBreadcrumbs, Typography, useTheme } from "@mui/material"
import { MdArrowForwardIos } from 'react-icons/md';
import Link from "@components/Link/Link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
//localisation
import { useTranslation } from 'next-i18next';

type BreadcrumbType = {
    href: string;
    label: string;
    isCurrent: boolean;
};

type BreadcrumbProps = {
  pageTitle?: string;
}

export default function Breadcrumbs ({ pageTitle }: BreadcrumbProps) {
    const router = useRouter();
    const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbType[]>([]);
  
    useEffect(() => {
      const pathWithoutQuery = router.asPath.split("?")[0];
      let pathArray = pathWithoutQuery.split("/");
      pathArray.shift();
  
      pathArray = pathArray.filter((path) => path !== "");
  
      const breadcrumbs: BreadcrumbType[] = pathArray.map((path, index) => {
        const href = "/" + pathArray.slice(0, index + 1).join("/");
        // checks if breadcrumb is last in the array
        // it will use the page's title if it is, but use the path if it is not.
        const label = index === pathArray.length - 1 ? (pageTitle || path) : (path.charAt(0).toUpperCase() + path.slice(1));
        return {
          href,
          label,
          isCurrent: index === pathArray.length - 1,
        };
      });
  
      setBreadcrumbs(breadcrumbs);
    }, [router.asPath, pageTitle]);

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
            {breadcrumb.label}
          </Link>
        ) : (
          // if it is null then use index as the key.
          <Typography sx={{color: theme.palette.primary.breadcrumbs,textWrap: 'wrap'}} key={index}>
            {breadcrumb.label}
          </Typography>
        )
      ) : (
        // renders if the breadcrumb is the last item.
        <Typography sx={{color: theme.palette.primary.breadcrumbs, textWrap: 'wrap'}} key={breadcrumb.href}>
          {breadcrumb.label}
        </Typography>
      )
    ))
      )
    };

    return (
        <MUIBreadcrumbs separator={<MdArrowForwardIos/>}>
          <Link sx={{color: theme.palette.primary.breadcrumbs}} href="/">{t("breadcrumbs.home_text")}</Link>
          {mapBreadcrumbs()};
        </MUIBreadcrumbs>
    )
} 