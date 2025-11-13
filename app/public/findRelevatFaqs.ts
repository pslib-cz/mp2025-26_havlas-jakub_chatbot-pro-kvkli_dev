import faqs from "./faq.json";

export function findRelevantFaqs(question: string, limit = 3) {
  const lower = question.toLowerCase();
  return faqs
    .flatMap(f => f.questions)
    .filter(q => q.q.toLowerCase().includes(lower) || q.a.toLowerCase().includes(lower))
    .slice(0, limit);
}