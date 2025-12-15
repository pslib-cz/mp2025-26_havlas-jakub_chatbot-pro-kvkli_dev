import { promptService } from "../services/prompt.service";
import { prismaService } from "../services/prisma.service";

export const promptResolvers = {
  Query: {
    prompts: async () => {
      return prismaService.findAllPrompts();
    },
  },
  Mutation: {
    addPrompt: async (_: any, args: any) => {
      return promptService.addPrompt(args);
    },

    addPromptFeedback: async (_: any, args: any) => {
      return promptService.addPromptFeedback(args);
    },

    deletePrompt: async (_: unknown, { id }: { id: number }) => {
      return prismaService.deletePrompt(id);
    },
  },
};