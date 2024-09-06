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


const Clusters: NextPage = () => {

  const { publicRuntimeConfig } = getConfig();
  const { session } = useSession();
	const { t } = useTranslation();
  const router = useRouter();
  const { id } = router.query; // Access the dynamic id parameter
  const client = useApolloClient();

  const { loading, error, data  } = useQuery(getClusters, {
    variables: { query: `id: ${id}` }, // Passing the dynamic variable
  });

	return (
		<AdminLayout title={t("nav.cluster.name")}>
			Cluster layout {id} <br/>
      <ul>
        {data?.instanceClusters?.content.map((instance, i: number) => (
          <li>
            {JSON.stringify(instance)}
          </li>
        ))}
      </ul>
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

export default Clusters;
