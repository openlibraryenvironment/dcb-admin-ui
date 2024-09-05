import { AdminLayout } from "@layout";
import { List, ListItem, ListItemButton, ListItemText } from "@mui/material";
import { GetServerSideProps, NextPage } from "next";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import axios from "axios";
import { useSession } from "next-auth/react";
import getConfig from "next/config";
import { useEffect, useState } from "react";

const Search: NextPage = () => {

  const { publicRuntimeConfig } = getConfig();
  const { data } = useSession();
	const { t } = useTranslation();
  const [searchResults, setSearchResults] = useState({});
  const [query, setQuery] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const response = await axios.get<any[]>(
					// query limit offset
          `${publicRuntimeConfig.DCB_SEARCH_BASE}/search/instances`,
          {
            headers: { Authorization: `Bearer ${data?.accessToken}` },
            params: {
              query: `@keyword all "${query}"`,
              offset: 0,
              limit: 100
            }
          },
        );
        setSearchResults(response.data);
        setLoading(false);
      } catch (error) {
        // setError(true);
        // setLoading(false);
      }
    };

    if (data?.accessToken) {
      fetchRecords();
    }
  }, [data?.accessToken, publicRuntimeConfig.DCB_API_BASE, query]);


  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  }

  const doSearch = () => {
    console.log("doSearch");
		setLoading(true);
		setQuery(inputValue);
	}

	const renderSearchResults = () => {
    console.log("doSearch");
		if ( searchResults?.instances == null )
      return ( <div></div> );


		return (
			<div>
				Total: {searchResults.totalRecords}
  		  <ul>
          {searchResults.instances.map((instance, i: number) => (
		  		  <li>
              <table>
                <tr>
                  <td> {i} : {instance.title}</td>
                </tr>
                <tr>
                  <td>
                    <a href={`/search/${instance.id}/cluster`}>Cluster Info</a> &nbsp;
                    <a href={`/search/${instance.id}/items`}>Item Info</a>
                  </td>
                </tr>
 	            </table>
            </li>
          )) }
  			</ul>
			</div>
    );
  }

	return (
		<AdminLayout title={t("nav.search.name")}>
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        placeholder="Enter search query"
      />
      <button onClick={doSearch}>Search -&gt;</button>
			<hr/>
			{renderSearchResults()}
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

export default Search;
