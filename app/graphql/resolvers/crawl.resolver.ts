import { crawlSite } from "../services/crawl.service";

export const crawlResolvers = {
  Mutation: {
    crawlWebsite: async (_: unknown, { url }: { url?: string }) => {

      return crawlSite(url);
    },
  },
};
