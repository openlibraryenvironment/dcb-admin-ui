import { NextPage } from 'next';

import { AdminLayout } from '@layout';

// import SignOutIfInactive from './useAutoSignout';
import { Paper, CardContent, Card, Typography, CardHeader, Button} from '@mui/material';
import { DataGrid } from '@components/DataGrid';
import { useResource } from '@hooks';
import { Mapping } from '@models/Mapping';
import { useSession } from 'next-auth/react';
import { useMemo, useState } from 'react';
import getConfig from 'next/config';

//localisation
import { useTranslation } from 'next-i18next';
import { useQueryClient } from '@tanstack/react-query';
import Import from '@components/Import/Import';
import useCode from '@hooks/useCode';
import dayjs from 'dayjs';

type Props = {
	category: string
};

const MappingsByCategory: NextPage<Props> = () => {
	// Access the accessToken for running authenticated requests
	const { data, status } = useSession();

	// Handles the import modal display
	const queryClient = useQueryClient();
	const [showImport, setImport] = useState(false);
	const openImport = () =>
	{
		setImport(true);
	}
	const closeImport = () => {
		setImport(false);
		queryClient.invalidateQueries();
		// forces the query to refresh once a new group is added	
	};
	const { t } = useTranslation();
	const ByCategory = ({ category }: any) => {
		const categoryToPass = category;
		const url = useMemo(() => {
			const { publicRuntimeConfig } = getConfig();
			return publicRuntimeConfig.DCB_API_BASE + '/uploadedMappings/'+categoryToPass;
		}, [categoryToPass]);

		const {
			resource,
			status: resourceFetchStatus,
		} = useResource<Mapping>({
			isQueryEnabled: status === 'authenticated',
			accessToken: data?.accessToken ?? null,
			baseQueryKey: 'mappingsByCategory',
			url: url,
		});
		
		// This will conditionally render by category
		// Use valueGetter for when we need to format specific values
		// TODO: Set lastImported to sort 'desc' by default https://mui.com/x/react-data-grid/sorting/
		return (
			<div>
				<Button variant="contained" onClick={openImport} > {t("mappings.import")}</Button>
				<DataGrid
					data={resource?.content ?? []}
					columns={[{field: 'fromCategory', headerName: "Category", minWidth: 50, flex: 0.5},
							{field: 'fromContext', headerName: "HostLMS", minWidth: 50, flex: 0.5},
							{field: 'fromValue', headerName: "Local Value", minWidth: 50, flex: 0.4}, 
							{field: 'label', headerName: "Meaning", minWidth: 50, flex: 0.5},
							{field: 'toValue', headerName: "DCB Value", minWidth: 50, flex: 0.5}, 
							{field: 'lastImported', headerName: "Last imported", minWidth: 100, flex: 0.5, 
							valueGetter: (params: { row: { lastImported: any; }; }) => {
								const lastImported = params.row.lastImported;
								return dayjs(lastImported).format('DD/MM/YY hh.mm A');
							}}]}		
					type={category}
					noDataLink={"#"}
					noDataMessage={t("mappings.import_circulation_status", "Import circulation status mappings for a Host LMS")}
					noDataTitle={t("mappings.no_results", "No results found")}
					selectable={false}
				/>
			</div>
		)
	}

	return (
		<AdminLayout>
			<Paper elevation={16}>
				<Card>
					{/* // style this to be more in line with wireframes */}
					<CardHeader title={<Typography variant = "h5"> {t("settings.circulation_status", "Item circulation status mappings")}</Typography>}/>                    
					<CardContent>
						<ByCategory category={useCode((state) => state.category) ?? "CirculationStatus"}/>
				    </CardContent>
				</Card>
			</Paper>
			<div>
			{ showImport ? <Import show={showImport}  onClose={closeImport}/> : null }
    		</div>
		</AdminLayout>
	);
};
// Add getServerSideProps back when we do server-side pagination work (DCB-480)

export default MappingsByCategory;