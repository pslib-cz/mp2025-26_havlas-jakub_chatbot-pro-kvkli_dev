import { prisma } from '../lib/prisma';
import { openai } from '../lib/openAI';
import { findRelevantFaqs } from '../public/findRelevatFaqs';
import { searchVectorBooks } from '../modelCalling/searchVectorBooks';




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

    prompts: async () => {
  const prompts = await prisma.prompt.findMany({
    include: { conversation: true },
  });
  return prompts || []; // <- ensure array, never null
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

  const systemPrompt = `
  Jsi knihovník Alda, virtuální asistent knihovny. 
  Odpovídáš pouze na otázky o knihovně, knihách, autorech a literatuře.
  Pokud se uživatel ptá na konkrétní knihu nebo autora, zavolej funkci "getRelatedBooks".
  Mluv česky, buď zdvořilý a informativní.
  `;

  if (!convoId) {
    const newConvo = await prisma.conversation.create({ data: { length: 0 } });
    convoId = newConvo.conversationId;
  }

  const relatedFaqs = findRelevantFaqs(promptText);
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

  // Define the available functions
  const functions = [
    {
      name: "getRelatedBooks",
      description:
        "Vyhledá knihy podle názvu, autora nebo tématu v katalogu knihovny.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description:
              "Název knihy, autor nebo klíčové slovo, podle kterého se má hledat.",
          },
        },
        required: ["query"],
      },
    },
  ];

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: messages as any,
    functions,
    function_call: "auto",
    temperature: 0.4,
  });

  const message = completion.choices[0].message;
  let answerText = "Žádná odpověď";

  // 🪄 If the model decides to call your book search
  if (message.function_call?.name === "getRelatedBooks") {
    const { query } = JSON.parse(message.function_call.arguments);

    const books = await searchVectorBooks(query);

    if (books.length > 0) {
      answerText =
        "Našel jsem tyto knihy, které by vás mohly zajímat:\n\n" +
        books
          .map(
            (b) =>
              `📘 *${b.title}* — ${b.author}\n${b.description || ""}`
          )
          .join("\n\n");
    } else {
      answerText = "Bohužel jsem nenašel žádné knihy, které by odpovídaly vašemu dotazu.";
    }
  } else {
    answerText = message.content ?? "Žádná odpověď";
  }

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

      const promptsForConversation = prompts.filter(
        (p) => p.conversationId === conversationId
      );
      const targetPrompt = promptsForConversation[promptNth];

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
 
     deletePrompt: async (_: unknown, { id }: { id: number }) => {
      console.log("Deleting prompt with ID:", id);
  const deletedPrompt = await prisma.prompt.delete({
    where: { promptId: Number(id) }, // only the ID, not the whole prompt
  });

  return deletedPrompt.promptId;
},
  },
};