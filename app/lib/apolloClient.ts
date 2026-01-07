import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';
import { useMemo } from 'react';

function createApolloClient() {
  return new ApolloClient({
    ssrMode: typeof window === 'undefined',
    link: new HttpLink({
      uri: '/api/graphql', // Relative URL - works in dev and production
      credentials: 'same-origin',
    }),
    cache: new InMemoryCache(),
  });
}

let client: ApolloClient | undefined;

export function initializeApollo() {
  const _client = client ?? createApolloClient();
  if (!client) client = _client;
  return _client;
}

export function useApollo() {
  return useMemo(() => initializeApollo(), []);
}
