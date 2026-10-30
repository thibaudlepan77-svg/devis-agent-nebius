export type QuoteLanguage = "en" | "fr";

// Function words only: they show up in any sentence whatever the industry, and
// none of them is common to both languages ("on", "a" and "en" are left out).
const FRENCH = new Set([
  "le", "la", "les", "des", "du", "un", "une", "et", "est", "sont", "nous", "vous", "nos", "notre", "votre",
  "pour", "avec", "dans", "sur", "que", "qui", "pas", "par", "au", "aux", "ce", "cette", "ces", "leur", "leurs",
]);

const ENGLISH = new Set([
  "the", "and", "is", "are", "we", "our", "you", "your", "for", "with", "in", "that", "who", "not", "to", "of",
  "by", "at", "this", "these", "be", "they", "their", "it", "an",
]);

// Left to itself, the model drifts to the language of the client's country
// (an English request for a French clinic came back in French), so the code
// decides and the prompt only relays the decision.
export function detectLanguage(text: string): QuoteLanguage {
  let balance = 0;
  for (const word of text.toLowerCase().match(/\p{L}+/gu) ?? []) {
    if (FRENCH.has(word)) balance += 1;
    else if (ENGLISH.has(word)) balance -= 1;
  }
  return balance > 0 ? "fr" : "en";
}

export const LANGUAGE_NAME: Record<QuoteLanguage, string> = { en: "English", fr: "French" };
