import { prisma } from "../../lib/prisma";
import { aiService } from "./ai.service";

export const promptService = {
  async addPrompt({ promptText, conversationId }: { promptText: string; conversationId?: number }) {
    let convoId = conversationId;

    if (!convoId) {
      const newConvo = await prisma.conversation.create({
        data: { length: 0 }
      });
      convoId = newConvo.conversationId;
    }

//const faqs = faqService.findRelevant(promptText);
const faqs = [{ q: "Jak mohu vypůjčit knihu?", a: "Knihy si můžete vypůjčit pomocí čtenářského průkazu na pokladně knihovny." }];
    const answer = await aiService.generateWithFaq({ promptText, faqs });

    const prompt = await prisma.prompt.create({
      data: {
        conversationId: convoId,
        promptText,
        answerText: answer,
      },
    });

    return { conversationId: convoId, prompt };
  },

  async addPromptFeedback({ conversationId, promptNth, userFeedback }: { conversationId: string; promptNth: number; userFeedback: string }) {
    const prompts = await prisma.prompt.findMany({
      where: { conversationId: parseInt(conversationId) },
      orderBy: { promptId: "asc" },
    });

    const target = prompts[promptNth];
    if (!target) throw new Error("Prompt not found.");

    return prisma.prompt.update({
      where: { promptId: target.promptId },
      data: { userFeedback: userFeedback === "true" || userFeedback === "1" },
    });
  }
};
