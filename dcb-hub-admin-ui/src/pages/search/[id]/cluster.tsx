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

import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';


// Create a styled TableCell component
const RotatedTableCell = styled(TableCell)({
  transform: 'rotate(90deg)',
  transformOrigin: 'bottom right',
  whiteSpace: 'nowrap',
  height: '100px', // Adjust the height as needed
  padding: '8px'   // Adjust the padding as needed
});



const Clusters: NextPage = () => {

  const { publicRuntimeConfig } = getConfig();
  const { data: session } = useSession();
	const { t } = useTranslation();
  const router = useRouter();
  const { id } = router.query; // Access the dynamic id parameter
  const client = useApolloClient();

	const extractMatchpoints = (clusterRecord) => {
    const result = [
      ...new Set(
      clusterRecord.members
        .map(member => member.matchPoints.map(matchPoint => matchPoint.value))
        .flat() // Step 2: Flatten the array of arrays
      )
    ];
		
		return result;
	}


  const { loading, error, data  } = useQuery(getClusters, {
    variables: { query: `id: ${id}` }, // Passing the dynamic variable
  });

	const theCluster = data?.instanceClusters?.content != null ? data?.instanceClusters?.content[0] : null;

	const matchpoints = theCluster != null ? extractMatchpoints(theCluster) : [];

	const hasMatchpoint = (mp, instance) => {
    const present = ( instance.matchPoints.some(obj => obj.value === mp) );
		return (<span>{present ? "GreenTick" : "RedCross" }</span>);
	}

							// {matchpoints.map((mp) => ( <TableCell> {hasMatchpoint(mp, instance)} </TableCell> ) ) }
	return (
		<AdminLayout title={t("nav.cluster.name")}>
			<h1>{theCluster?.title}</h1>
			<Table>
				<TableHead>
          <TableRow >
	  				<TableCell colSpan={20}>Member</TableCell>
		  		</TableRow>
	        <TableRow >
						{matchpoints.map((mp) => ( <TableCell>{mp}</TableCell> ) ) }
					</TableRow>
				</TableHead>
        <TableBody>
	        {theCluster?.members?.map((instance, i: number) => (
            <>
			        <TableRow>
				        <TableCell colspan={matchpoints?.length}>
									<h2>{i+1} {instance.title}</h2>
									<dl>
							      <dt>Id</dt><dd>{instance.id}</dd>
							      <dt>Title</dt><dd>{instance.title}</dd>
							      <dt>Author</dt><dd>{instance.author}</dd>
									</dl>
					      </TableCell>
				      </TableRow>
			        <TableRow>
								{matchpoints.map((mp) => ( <TableCell> {hasMatchpoint(mp, instance)} </TableCell> ) ) }
			        </TableRow>
            </>
	        ))}
        </TableBody>
      </Table>
      <hr/>
      {data?.instanceClusters?.content.map((instance, i: number) => (
        <div>
          <h1>{i} {instance.title}</h1>
          <pre>{JSON.stringify(instance, null, '  ')}</pre>
        </div>
      ))}
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
