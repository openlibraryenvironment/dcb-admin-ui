import { Breadcrumbs as MUIBreadcrumbs } from "@mui/material"
import { MdArrowForwardIos } from 'react-icons/md';
import Link from "@components/Link/Link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

type BreadcrumbType = {
    href: string;
    label: string;
    isCurrent: boolean;
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
          label: path.charAt(0).toUpperCase() + path.slice(1),
          isCurrent: index === pathArray.length - 1,
        };
      });
  
      setBreadcrumbs(breadcrumbs);
    }, [router.asPath]);

    return (
        <MUIBreadcrumbs separator={<MdArrowForwardIos/>}>
        <Link color="inherit" href="/">Home</Link>
        {breadcrumbs?.map((breadcrumb) => (
          <Link color="inherit" underline="hover" key={breadcrumb.href} href={breadcrumb.href}>
            {breadcrumb.label}
          </Link>
        ))}
        </MUIBreadcrumbs>
    )
} 