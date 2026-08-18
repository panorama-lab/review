import { normalizeDoi } from "./doi.ts";

const DOI_PATTERN =
  /(?:https?:\/\/(?:dx\.)?doi\.org\/|doi:\s*)?(10\.\d{4,9}\/[^\s<>"'{}|\\^\[\]`]+)/gi;

function stripTrailingPunctuation(value: string): string {
  return value.replace(/[.,;:)\]]+$/g, "");
}

export function extractDoiFromText(text: string): string | null {
  if (!text.trim()) return null;

  const matches = text.matchAll(DOI_PATTERN);
  for (const match of matches) {
    const raw = stripTrailingPunctuation(match[1] ?? match[0] ?? "");
    if (!raw) continue;
    const normalized = normalizeDoi(raw);
    if (/^10\.\d{4,9}\//.test(normalized)) {
      return normalized;
    }
  }

  return null;
}

export async function extractDoiFromPdf(filePath: string): Promise<string | null> {
  const { LiteParse } = await import("@llamaindex/liteparse");
  const parser = new LiteParse({
    targetPages: "1-2",
    ocrEnabled: false,
    quiet: true,
    outputFormat: "text",
    maxPages: 2,
  });

  const result = await parser.parse(filePath);
  const pageText = result.pages
    .filter((page) => page.pageNum >= 1 && page.pageNum <= 2)
    .sort((a, b) => a.pageNum - b.pageNum)
    .map((page) => page.text)
    .join("\n\n");

  return extractDoiFromText(pageText || result.text || "");
}
