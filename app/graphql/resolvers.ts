import { prisma } from '../lib/prisma';
import { Conversation, Prompt } from '../generated/prisma';

interface ConversationArgs {
  id: string | number;
}

interface PromptArgs {
  id: string | number;
}

interface CreateConversationArgs {
  length: number;
}

interface AddPromptArgs {
  conversationId: number;
  promptText: string;
  answerText: string;
}

export const resolvers = {
  Query: {
    conversations: async (): Promise<Conversation[]> => {
      return prisma.conversation.findMany({
        include: { prompts: true },
      });
    },
    conversation: async (
      _: unknown,
      args: ConversationArgs
    ): Promise<Conversation | null> => {
      return prisma.conversation.findUnique({
        where: { conversationId: Number(args.id) },
        include: { prompts: true },
      });
    },
    prompts: async (): Promise<Prompt[]> => {
      return prisma.prompt.findMany({
        include: { conversation: true },
      });
    },
    prompt: async (
      _: unknown,
      args: PromptArgs
    ): Promise<Prompt | null> => {
      return prisma.prompt.findUnique({
        where: { promptId: Number(args.id) },
        include: { conversation: true },
      });
    },
  },

  Mutation: {
    createConversation: async (
      _: unknown,
      args: CreateConversationArgs
    ): Promise<Conversation> => {
      return prisma.conversation.create({
        data: { length: args.length },
      });
    },
    addPrompt: async (
      _: unknown,
      args: AddPromptArgs
    ): Promise<Prompt> => {
      const { conversationId, promptText, answerText } = args;
      return prisma.prompt.create({
        data: {
          conversationId,
          promptText,
          answerText,
        },
      });
    },
  },
};
