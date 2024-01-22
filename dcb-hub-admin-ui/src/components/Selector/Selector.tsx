import useResource from "@hooks/useResource";
import useCode from "@hooks/useCode";
import { HostLmsPage } from "@models/HostLMSPage";
import { Autocomplete, TextField } from "@mui/material";
import { useSession } from "next-auth/react";
import getConfig from "next/config";
import { useMemo, useState } from "react";
import { getHostLms } from "src/queries/queries";

type SelectorType = {
    optionsType?: string;
    options?: any;
}

// This is a selector of HostLMS present on the DCB instance.
// It can also be further genericised to support selecting any value -
// for example requests, locations etc

export default function Selector({optionsType, options}: SelectorType) {

  // We can and will replace this with a specialised GraphQL query based on code.
  
  // can pass in type, too
  const { data: session, status } = useSession();
  const code = useCode((state) => state.code);
  const updateCode = useCode((state) => state.updateCode);
  const [hostLmsId, setHostLmsId] = useState();
  // Generate the url for the useResource hook
  const url = useMemo(() => {
    const { publicRuntimeConfig } = getConfig();
    return publicRuntimeConfig.DCB_API_BASE + '/graphql';
    }, []);
    const queryVariables = {};

  const {
    resource,
    status: resourceFetchStatus,
    } = useResource<HostLmsPage>({
        isQueryEnabled: status === 'authenticated',
        accessToken: session?.accessToken ?? null,
        baseQueryKey: 'hostlms',
        url: url,
        type: 'GraphQL',
        graphQLQuery: getHostLms,
        graphQLVariables: queryVariables
  }); 
  // To extend this component further consider principles from https://mui.com/material-ui/react-autocomplete/#load-on-open
    
  const rows:any = resource?.content;
  const hostLmsData = rows?.hostLms?.content;
  const names = hostLmsData?.map((item: { name: any; id: any; }) => ({
        label: item.name,
        value: item.id,
  }));
    // Here, we map across the names and associated IDs for each HostLMS option.
    // This means that the ID will be available for us when we need to import for a specific HostLMS.
  return (
      <Autocomplete
        onChange={(event, value) => {
          updateCode(value?.label)
          setHostLmsId(value?.value);
        }}
      // Here we can store the value to be used for import, and supply the necessary hostlms ID
        disablePortal
        id="selector-combo-box"
        options={names ?? []}
        getOptionLabel={(option: any) => option.label}
        fullWidth
        renderInput={(params: any) => <TextField {...params} required label={optionsType} />}
        isOptionEqualToValue={(option, value) => option.id === value.id}
      />
  );
}