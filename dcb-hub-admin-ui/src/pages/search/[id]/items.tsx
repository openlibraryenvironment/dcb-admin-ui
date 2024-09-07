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
import { Tooltip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';


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
      } catch (error) { console.error("problem",error);
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
			Items available for cluster {id} <br/>
			
      <Table>
        <TableHead>
	        <TableRow >
		        <TableCell>ID (Authority)</TableCell>
		        <TableCell>Status</TableCell>
		        <TableCell>Location</TableCell>
		        <TableCell>Barcode (Call No)</TableCell>
		        <TableCell>Requestable</TableCell>
		        <TableCell>Suppressed</TableCell>
		        <TableCell>Hold Count</TableCell>
		        <TableCell>Canonical Item Type</TableCell>
		        <TableCell>Local Item Type</TableCell>
		        <TableCell>Agency (Name)</TableCell>
				  </TableRow>
        </TableHead>
        <TableBody>
          {availabilityResults?.itemList?.map((item, i: number) => (
            <TableRow>
              <TableCell> <Tooltip title={`${item.hostLmsCode}:${item.id}`}>{item.id} </Tooltip> </TableCell>
              <TableCell>{item.status.code}</TableCell>
              <TableCell> <Tooltip title={item.location.name}> {item.location.code} </Tooltip> </TableCell>
              <TableCell> <Tooltip title={item.callNumber}> {item.barcode} </Tooltip> </TableCell>
              <TableCell>{item.isRequestable ? 'YES' : 'NO'}</TableCell>
              <TableCell>{item.isSuppressed ? 'YES' : 'NO' }</TableCell>
              <TableCell>{item.holdCount}</TableCell>
              <TableCell>{item.canonicalItemType}</TableCell>
              <TableCell> <Tooltip title={item.localItemType}> {item.localItemTypeCode} </Tooltip> </TableCell>
              <TableCell> <Tooltip title={item.agency.description}> {item.agency.code} </Tooltip> </TableCell>
            </TableRow>
          ))}
        </TableBody>
			</Table>
		</AdminLayout>
	);
  // availability: {JSON.stringify(availabilityResults)}
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
