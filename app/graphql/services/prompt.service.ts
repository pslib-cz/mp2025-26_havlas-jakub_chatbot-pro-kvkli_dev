import { prisma } from "../../lib/prisma";
import { aiService } from "./ai.service";
import { AddPromptFeedbackArgs } from "../../types";

export const promptService = {
    async addPrompt({
        promptText,
        conversationId,
    }: {
        promptText: string;
        conversationId?: number;
    }) {
        let convoId = conversationId;

        if (!convoId) {
            const newConvo = await prisma.conversation.create({
                data: { length: 0 },
            });
            convoId = newConvo.conversationId;
        }

        const answer = await aiService.generateWithFaq({ promptText });

        const prompt = await prisma.prompt.create({
            data: {
                conversationId: convoId,
                promptText,
                answerText: answer,
            },
        });

        return { conversationId: convoId, prompt };
    },

    async addPromptFeedback({
        conversationId,
        promptNth,
        userFeedback,
    }: AddPromptFeedbackArgs) {
        const prompts = await prisma.prompt.findMany({
            where: { conversationId },
            orderBy: { promptId: "asc" },
        });

        const target = prompts[promptNth];
        if (!target) throw new Error("Prompt not found.");

        return prisma.prompt.update({
            where: { promptId: target.promptId },
            data: { userFeedback },
        });
    },
};
