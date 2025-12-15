import { ApolloServer } from '@apollo/server';
import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { typeDefs } from '../../../../graphql/schema';
import { resolvers } from '../../../../graphql/resolvers/index';
import { prisma } from '../../../../lib/prisma';

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

const handler = startServerAndCreateNextHandler(server, {
  context: async () => ({ prisma }),
});


export { handler as GET, handler as POST };
