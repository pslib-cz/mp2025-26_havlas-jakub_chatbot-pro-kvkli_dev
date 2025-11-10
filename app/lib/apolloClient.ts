import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';
import { useMemo } from 'react';

let client = new ApolloClient({
  link: new HttpLink({ uri: "http://localhost:3000/api/graphql" }),
  cache: new InMemoryCache(),
});

function createApolloClient() {
  return new ApolloClient({
    ssrMode: typeof window === 'undefined',
    link: new HttpLink({
      uri: '/api/graphql', // your API route
      credentials: 'same-origin',
    }),
    cache: new InMemoryCache(),
  });
}

export function initializeApollo() {
  const _client = client ?? createApolloClient();
  if (!client) client = _client;
  return _client;
}

export function useApollo() {
  return useMemo(() => initializeApollo(), []);
}
