import { prismaService } from "../services/prisma.service";
import { AddConvoFeedbackArgs } from "../../types";

export const conversationResolvers = {
  Query: {
    conversations: async () => {
      return prismaService.findAllConversations();
    },
    conversation: async (_: unknown, { id }: { id: string }) => {
      return prismaService.findConversationById(id);
    },
  },
  Mutation: {
    addConvoFeedback: async (
      _: unknown,
      { conversationId, userFeedbackMessage, userFeedback }: AddConvoFeedbackArgs
    ) => {
      return prismaService.updateConversationFeedback(
        conversationId,
        userFeedbackMessage,
        userFeedback
      );
    },
  },
};