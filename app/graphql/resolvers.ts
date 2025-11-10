import { prisma } from '../lib/prisma';

interface AddPromptArgs {
  promptText: string;
  conversationId?: number | null;
}

interface AddPromptFeedbackArgs {
  conversationId: number;
  promptNth: number;
  userFeedback: boolean;
}

interface AddConvoFeedbackArgs {
  conversationId: number;
  userFeedbackMessage?: string | null;
  userFeedback?: boolean | null;
}

export const resolvers = {
  Query: {
    conversations: async () => {
      return prisma.conversation.findMany({
        include: { prompts: true },
      });
    },

    conversation: async (_: unknown, { id }: { id: string }) => {
      return prisma.conversation.findUnique({
        where: { conversationId: Number(id) },
        include: { prompts: true },
      });
    },
  },

  Mutation: {
    // 1️⃣ Add Prompt (and create conversation if needed)
    addPrompt: async (_: unknown, { promptText, conversationId }: AddPromptArgs) => {
      let convoId = conversationId;

      if (!convoId) {
        const newConvo = await prisma.conversation.create({
          data: { length: 0 },
        });
        convoId = newConvo.conversationId;
      }

      // Here you’d call your AI service to get the answer
      // const answerText = await callAI(promptText)
      const answerText = `AI response to: ${promptText}`; // placeholder

      const prompt = await prisma.prompt.create({
        data: {
          conversationId: convoId!,
          promptText,
          answerText,
        },
      });

      // Update conversation length
      await prisma.conversation.update({
        where: { conversationId: convoId! },
        data: { length: { increment: 1 } },
      });

      return { conversationId: convoId, prompt };
    },

    // 2️⃣ Add Prompt Feedback
    addPromptFeedback: async (
      _: unknown,
      { conversationId, promptNth, userFeedback }: AddPromptFeedbackArgs
    ) => {
      const prompts = await prisma.prompt.findMany({
        where: { conversationId },
        orderBy: { promptId: 'asc' },
      });

      const targetPrompt = prompts[promptNth - 1];
      if (!targetPrompt) throw new Error(`Prompt #${promptNth} not found in conversation ${conversationId}`);

      return prisma.prompt.update({
        where: { promptId: targetPrompt.promptId },
        data: { userFeedback },
      });
    },

    // 3️⃣ Add Conversation Feedback
    addConvoFeedback: async (
      _: unknown,
      { conversationId, userFeedbackMessage, userFeedback }: AddConvoFeedbackArgs
    ) => {
      return prisma.conversation.update({
        where: { conversationId },
        data: {
          userFeedback,
          userFeedbackMessage,
        },
        include: { prompts: true },
      });
    },
  },
};
