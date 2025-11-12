import { prisma } from '../lib/prisma';
import OpenAI from "openai";
import { systemPrompt } from '../modelCalling/prompt';
import { findRelevantFaqs } from '../public/findRelevatFaqs';
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

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
    addPrompt: async (_: unknown, { promptText, conversationId }: AddPromptArgs) => {
      let convoId = conversationId;

      if (!convoId) {
        const newConvo = await prisma.conversation.create({ data: { length: 0 } });
        convoId = newConvo.conversationId;
      }

      // 🟢 Find relevant FAQs
      const relatedFaqs: { q: string; a: string }[] = findRelevantFaqs(promptText);
      const faqSection = relatedFaqs
        .map((f: { q: string; a: string }) => `Q: ${f.q}\nA: ${f.a}`)
        .join("\n\n");

      const messages = [
        { role: "system", content: systemPrompt },
        {
          role: "system",
          content: faqSection
            ? `Použij následující informace z oficiálních FAQ knihovny:\n\n${faqSection}`
            : `Nemáš žádné konkrétní FAQ k dispozici.`
        },
        { role: "user", content: promptText },
      ];

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: messages as any,
        temperature: 0.4,
      });

      const answerText = completion.choices[0].message.content ?? "Žádná odpověď";

      const prompt = await prisma.prompt.create({
        data: { conversationId: convoId!, promptText, answerText },
      });

      return { conversationId: convoId, prompt };
    },

 
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
}
