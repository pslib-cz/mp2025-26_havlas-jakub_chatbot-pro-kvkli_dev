import { PrismaClient, Prisma } from "../generated/prisma";

const prisma = new PrismaClient();

const conversationData: Prisma.ConversationCreateInput[] = [
  {
    length: 2,
    userFeedback: true,
    userFeedbackMessage: "Very helpful conversation!",
    prompts: {
      create: [
        {
          promptText: "What is the capital of France?",
          answerText: "The capital of France is Paris.",
          userFeedback: true,
        },
        {
          promptText: "What is 2 + 2?",
          answerText: "2 + 2 equals 4.",
          userFeedback: true,
        },
      ],
    },
  },
  {
    length: 3,
    userFeedback: false,
    userFeedbackMessage: "Some answers were unclear.",
    prompts: {
      create: [
        {
          promptText: "Explain the theory of relativity.",
          answerText: "The theory of relativity is about how space and time are linked for objects moving at a constant speed relative to each other.",
        },
        {
          promptText: "What is the boiling point of water?",
          answerText: "The boiling point of water is 100°C at standard atmospheric pressure.",
        },
        {
          promptText: "Who wrote '1984'?",
          answerText: "George Orwell wrote '1984'.",
          userFeedback: false,
        },
      ],
    },
  },
];

export async function main() {
  for (const c of conversationData) {
    await prisma.conversation.create({ data: c });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
