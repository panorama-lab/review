import type { ParsedLiterature } from "./types.ts";

const MONTHS: Record<string, string> = {
  JAN: "01",
  FEB: "02",
  MAR: "03",
  APR: "04",
  MAY: "05",
  JUN: "06",
  JUL: "07",
  AUG: "08",
  SEP: "09",
  OCT: "10",
  NOV: "11",
  DEC: "12",
};

function normalizeBibTeXMonth(value: string): string | null {
  const normalized = value.trim().replace(/[{}"]+/g, "");
  if (!normalized) {
    return null;
  }

  if (/^\d{1,2}$/.test(normalized)) {
    return normalized.padStart(2, "0");
  }

  const upper = normalized.slice(0, 3).toUpperCase();
  return MONTHS[upper] ?? null;
}

function extractBibTeXValue(input: string, start: number): { value: string; nextIndex: number } {
  const quote = input[start];

  if (quote === "{") {
    let depth = 1;
    let index = start + 1;

    while (index < input.length && depth > 0) {
      const char = input[index];

      if (char === "{") {
        depth += 1;
      } else if (char === "}") {
        depth -= 1;
      }

      index += 1;
    }

    return {
      value: input.slice(start + 1, Math.max(start + 1, index - 1)),
      nextIndex: index,
    };
  }

  if (quote === '"') {
    let index = start + 1;

    while (index < input.length) {
      if (input[index] === '"' && input[index - 1] !== "\\") {
        break;
      }

      index += 1;
    }

    return {
      value: input.slice(start + 1, index),
      nextIndex: Math.min(index + 1, input.length),
    };
  }

  let index = start;
  while (
    index < input.length &&
    input[index] !== "," &&
    input[index] !== "\n" &&
    input[index] !== "\r"
  ) {
    index += 1;
  }

  return {
    value: input.slice(start, index),
    nextIndex: index,
  };
}

function parseBibTeXFields(body: string): Record<string, string> {
  const fields: Record<string, string> = {};
  let index = 0;

  while (index < body.length) {
    while (index < body.length && /[\s,]/.test(body[index])) {
      index += 1;
    }

    if (index >= body.length) {
      break;
    }

    const keyStart = index;
    while (index < body.length && /[A-Za-z0-9_:\-]/.test(body[index])) {
      index += 1;
    }

    const rawKey = body.slice(keyStart, index).trim();
    if (!rawKey) {
      index += 1;
      continue;
    }

    while (index < body.length && /\s/.test(body[index])) {
      index += 1;
    }

    if (body[index] !== "=") {
      while (index < body.length && body[index] !== ",") {
        index += 1;
      }
      continue;
    }

    index += 1;

    while (index < body.length && /\s/.test(body[index])) {
      index += 1;
    }

    const { value, nextIndex } = extractBibTeXValue(body, index);
    fields[rawKey.toLowerCase()] = value.trim();
    index = nextIndex;
  }

  return fields;
}

function parseBibTeXEntries(
  text: string,
): Array<{ type: string; citationKey: string | null; fields: Record<string, string> }> {
  const entries: Array<{
    type: string;
    citationKey: string | null;
    fields: Record<string, string>;
  }> = [];
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  let index = 0;

  while (index < normalized.length) {
    const atIndex = normalized.indexOf("@", index);
    if (atIndex === -1) {
      break;
    }

    let typeEnd = atIndex + 1;
    while (typeEnd < normalized.length && /[A-Za-z]/.test(normalized[typeEnd])) {
      typeEnd += 1;
    }

    const type = normalized
      .slice(atIndex + 1, typeEnd)
      .trim()
      .toLowerCase();
    if (!type) {
      index = atIndex + 1;
      continue;
    }

    while (typeEnd < normalized.length && /\s/.test(normalized[typeEnd])) {
      typeEnd += 1;
    }

    const opening = normalized[typeEnd];
    if (opening !== "{" && opening !== "(") {
      index = typeEnd + 1;
      continue;
    }

    const closing = opening === "{" ? "}" : ")";
    let depth = 1;
    let bodyEnd = typeEnd + 1;

    while (bodyEnd < normalized.length && depth > 0) {
      const char = normalized[bodyEnd];

      if (char === opening) {
        depth += 1;
      } else if (char === closing) {
        depth -= 1;
      }

      bodyEnd += 1;
    }

    const body = normalized.slice(typeEnd + 1, Math.max(typeEnd + 1, bodyEnd - 1)).trim();
    const firstCommaIndex = body.indexOf(",");
    const citationKey =
      firstCommaIndex === -1 ? null : body.slice(0, firstCommaIndex).trim() || null;
    const fields = firstCommaIndex === -1 ? {} : parseBibTeXFields(body.slice(firstCommaIndex + 1));

    if (type !== "comment" && type !== "preamble" && type !== "string") {
      entries.push({ type, citationKey, fields });
    }

    index = bodyEnd;
  }

  return entries;
}

function normalizeBibTeXText(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.replace(/[{}]/g, "").replace(/\s+/g, " ").trim();

  return normalized || null;
}

function normalizeBibTeXAuthors(value: string | undefined): string | null {
  const authors = normalizeBibTeXText(value);
  if (!authors) {
    return null;
  }

  return authors
    .split(/\s+and\s+/i)
    .map((author) => author.trim())
    .filter(Boolean)
    .join("; ");
}

function buildBibTeXRecord(entry: {
  type: string;
  citationKey: string | null;
  fields: Record<string, string>;
}): ParsedLiterature {
  const { fields } = entry;
  const yearMatch = fields.year?.match(/\d{4}/);

  return {
    publicationType: entry.type,
    doi: normalizeBibTeXText(fields.doi),
    title: normalizeBibTeXText(fields.title) ?? "",
    abstract: normalizeBibTeXText(fields.abstract) ?? "",
    authors: normalizeBibTeXAuthors(fields.author),
    journal:
      normalizeBibTeXText(fields.journal) ??
      normalizeBibTeXText(fields.journaltitle) ??
      normalizeBibTeXText(fields.booktitle),
    issn: normalizeBibTeXText(fields.issn),
    publicationMonth: normalizeBibTeXMonth(fields.month ?? ""),
    publicationYear: yearMatch?.[0] ?? null,
    volume: normalizeBibTeXText(fields.volume),
    issue: normalizeBibTeXText(fields.number),
    articleNumber: normalizeBibTeXText(fields.eid) ?? normalizeBibTeXText(fields.articleno),
    accessionNumber: entry.citationKey,
  };
}

export const parseBibTeX = (text: string): ParsedLiterature[] => {
  return parseBibTeXEntries(text).map(buildBibTeXRecord);
};
