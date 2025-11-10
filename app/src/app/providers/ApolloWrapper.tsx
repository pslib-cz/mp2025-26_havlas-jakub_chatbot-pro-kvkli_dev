'use client'; 
import { ApolloProvider } from "@apollo/client/react";
import { useApollo } from '../../../lib/apolloClient';

export default function ApolloWrapper({ children }: { children: React.ReactNode }) {
  const client = useApollo();

  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
