import { AdminLayout } from "@layout";
import { List, ListItem, ListItemButton, ListItemText } from "@mui/material";
import { GetServerSideProps, NextPage } from "next";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import axios from "axios";
import { useSession } from "next-auth/react";
import getConfig from "next/config";
import { useEffect, useState } from "react";
import { useRouter } from 'next/router';

const Cluster: NextPage = () => {

  const { publicRuntimeConfig } = getConfig();
  const { data } = useSession();
	const { t } = useTranslation();
  const router = useRouter();
  const { id } = router.query; // Access the dynamic id parameter
  const [clusterDetail, setClusterDetail] = useState({});

  useEffect(() => {
    const fetchCluster = async () => {
      try {
        const response = await axios.get<any[]>(
          // query limit offset
          `${publicRuntimeConfig.DCB_API_BASE}/clusters/${id}`,
          {
            headers: { Authorization: `Bearer ${data?.accessToken}` }
          },
        );
        setClusterDetail(response.data);
        setLoading(false);
      } catch (error) {
        // setError(true);
        // setLoading(false);
      }
    };

    if ( (id) && (data?.accessToken) ) {
      fetchCluster();
    }
  }, [data?.accessToken, publicRuntimeConfig.DCB_API_BASE, id]);

	return (
		<AdminLayout title={t("nav.clusterdetail.name")}>
			Cluster {id}
      {JSON.stringify(clusterDetail)}
		</AdminLayout>
	);
};


export const getServerSideProps: GetServerSideProps = async (context) => {
	const { locale } = context;

	let translations = {};
	if (locale) {
		translations = await serverSideTranslations(locale as string, [
			"common",
			"application",
			"validation",
		]);
	}
	return {
		props: {
			...translations,
		},
	};
};

export default Cluster;
