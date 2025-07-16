import { memoryKeywords } from "./memoryKeywords";

// Bỏ dấu tiếng Việt
export function removeDiacritics(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// Chuẩn hóa input: bỏ dấu, thường hóa, bỏ dấu câu, khoảng trắng dư
export function normalizeInput(input: string): string {
  return removeDiacritics(input)
    .toLowerCase()
    .replace(/[.,!?;:()"'“”‘’]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// So khớp keyword đơn giản
export function keywordFilter(input: string): boolean {
  const normalized = normalizeInput(input);
  return memoryKeywords.some((kw) => normalized.includes(kw));
}

// Phát hiện mẫu giới thiệu ngắn + có vẻ cá nhân
export function patternFilter(input: string): boolean {
  const normalized = normalizeInput(input);
  const wordCount = normalized.split(/\s+/).length;

  const startsWithPersonalIntro =
    normalized.startsWith("toi ") ||
    normalized.startsWith("minh ") ||
    normalized.startsWith("tôi ") || // vẫn giữ gốc có dấu để phòng
    normalized.startsWith("mình ") ||
    normalized.startsWith("i ") ||
    normalized.startsWith("im ") ||
    normalized.startsWith("i am ") ||
    normalized.startsWith("my ");

  const containsFirstPerson = /\b(i|i'm|im|my|me|mine|toi|minh|tôi|mình)\b/.test(normalized);

  const containsIsVerb = /\bam|is|are|la|dang|hoc|song|thich|yeu|muon\b/.test(normalized);

  const shortEnough = wordCount <= 40; // tránh các đoạn quá dài (không phải hồ sơ)

  return (
    (startsWithPersonalIntro || (containsFirstPerson && containsIsVerb)) &&
    shortEnough
  );
}
