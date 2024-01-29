

import { PropsWithChildren, useMemo } from 'react';
import { ApolloClient, ApolloProvider, HttpLink, InMemoryCache, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { useSession } from 'next-auth/react';
import getConfig from 'next/config';
  
export const ApolloProviderWrapper = ({ children }: PropsWithChildren) => {
    const { data: session } = useSession(); 
    const url = useMemo(() => {
		  const { publicRuntimeConfig } = getConfig();
		  return new HttpLink({uri: publicRuntimeConfig.DCB_API_BASE + '/graphql'});
	  }, []);
    
    const client = useMemo(() => {
      const authMiddleware = setContext((operation, { headers }) => {
        const token = session?.accessToken;
        return {
          headers: {
            ...headers,
            authorization: token ? `Bearer ${token}` : '',
          },
        };
      });
  
      return new ApolloClient({
        link: from([authMiddleware, url]),
        cache: new InMemoryCache(),
        ssrMode: true,
      });
    }, [url, session?.accessToken]);
  
    return <ApolloProvider client={client}>{children}</ApolloProvider>;
  };
  
