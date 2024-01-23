import useCode from "@hooks/useCode";
import { Autocomplete, TextField } from "@mui/material";
import { useState } from "react";
import { getHostLmsSelection } from "src/queries/queries";
import { useQuery } from "@apollo/client/react";

type SelectorType = {
    optionsType?: string;
    options?: any;
}

// This is a selector of HostLMS present on the DCB instance.
// It can also be further genericised to support selecting any value -
// for example requests, locations etc

export default function Selector({optionsType, options}: SelectorType) {

  const updateCode = useCode((state) => state.updateCode);
  const [hostLmsId, setHostLmsId] = useState();

  const { loading, error, data } = useQuery(getHostLmsSelection, { variables: { order: "name", orderBy: "ASC" }});

  // To extend this component further consider principles from https://mui.com/material-ui/react-autocomplete/#load-on-open
  const rows:any = data?.content;
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