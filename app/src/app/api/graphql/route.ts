import { ApolloServer } from '@apollo/server';
import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { typeDefs } from '../../../../graphql/schema';
import { resolvers } from '../../../../graphql/resolvers';
import { prisma } from '../../../../lib/prisma';

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

// ✅ Create one handler function for both GET & POST
const handler = startServerAndCreateNextHandler(server, {
  context: async () => ({ prisma }),
});

// ✅ Re-export GET and POST handlers for Next.js Route API
export { handler as GET, handler as POST };
