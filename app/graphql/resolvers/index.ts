import { promptResolvers } from "./prompt.resolver";
import { conversationResolvers } from "./conversation.resolver";
import { crawlResolvers } from "./crawl.resolver";

export const resolvers = {
  Query: {
    ...conversationResolvers.Query,
    ...promptResolvers.Query,
  },

  Mutation: {
    ...promptResolvers.Mutation,
    ...conversationResolvers.Mutation,
    ...crawlResolvers.Mutation,
  }
};
