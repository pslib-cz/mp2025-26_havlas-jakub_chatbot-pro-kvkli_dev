import { openai } from "../../lib/openAI";
import { ChatCompletionMessageParam } from "openai/resources/chat";
import { vectorService } from "./vector.service";

export const aiService = {
  async generateWithFaq({ promptText, faqs }: { promptText: string; faqs: Array<{ q: string; a: string }> }) {
    const faqText = faqs
      .map(f => `Q: ${f.q}\nA: ${f.a}`)
      .join("\n\n");

    const messages: ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `
        Jsi knihovník Alda...
        `
      },
      {
        role: "system",
        content: faqText ? `Použij FAQ:\n${faqText}` : "Žádné FAQ nejsou k dispozici."
      },
      { role: "user", content: promptText }
    ];

    const functions = [
      {
        name: "getRelatedBooks",
        parameters: {
          type: "object",
          properties: { query: { type: "string" } },
          required: ["query"]
        }
      }
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      functions,
      function_call: "auto",
      temperature: 0.4
    });

    const message = response.choices[0].message;

    if (message.function_call?.name === "getRelatedBooks") {
      const { query } = JSON.parse(message.function_call.arguments);
      const books = await vectorService.searchBooks(query);

      return books.length
        ? books.map(b => `📘 ${b.title} — ${b.author}`).join("\n\n")
        : "Nenašel jsem žádné knihy.";
    }

    return message.content ?? "Žádná odpověď";
  }
};
