// server/src/utils/filters.ts
import { memoryKeywords } from "./memoryKeywords";

export function removeDiacritics(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function normalizeInput(input: string): string {
  return removeDiacritics(input)
    .toLowerCase()
    .replace(/[.,!?]/g, "")
    .trim();
}

export function keywordFilter(input: string): boolean {
  const normalized = normalizeInput(input);
  return memoryKeywords.some(kw => normalized.includes(kw));
}

export function patternFilter(input: string): boolean {
  const normalized = normalizeInput(input);
  const wordCount = normalized.split(/\s+/).length;
  const startsWithIntro =
    normalized.startsWith("toi ") ||
    normalized.startsWith("minh ") ||
    normalized.startsWith("i ") ||
    normalized.startsWith("im") ||
    normalized.startsWith("i am");

  return startsWithIntro && wordCount < 30;
}
