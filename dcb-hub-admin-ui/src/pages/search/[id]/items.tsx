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
import { useApolloClient, useQuery } from "@apollo/client";
import { getClusters } from "src/queries/queries";


const Items: NextPage = () => {

  const { publicRuntimeConfig } = getConfig();
  const { data: sess } = useSession();
	const { t } = useTranslation();
  const router = useRouter();
  const { id } = router.query; // Access the dynamic id parameter
  const [availabilityResults, setAvailabilityResults] = useState({});

	// lets fetch /items/availability?clusteredBibId={id}
  useEffect(() => {
    const fetchRecords = async () => {
			console.log("Fetching records....{}",sess);
      try {
        const response = await axios.get<any[]>(
          // query limit offset
          `${publicRuntimeConfig.DCB_API_BASE}/items/availability`,
          {
            headers: { Authorization: `Bearer ${sess?.accessToken}` },
            params: {
              clusteredBibId: id,
							filters: 'none'
            }
          },
        );
        setAvailabilityResults(response.data);
      } catch (error) {
				console.error("problem",error);
        // setError(true);
      }
    };

		console.log("Testing %o %o",id,sess);

    if ( (id) && (sess?.accessToken) ) {
      fetchRecords();
    }
  }, [sess, publicRuntimeConfig.DCB_API_BASE, id]);

	return (
		<AdminLayout title={t("nav.search.name")}>
			Items layout {id} <br/>
      availability: {JSON.stringify(availabilityResults)}
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

export default Items;
