import type { ParsedLiterature } from "./types.ts";

const RIS_LINE_RE = /^([A-Z0-9][A-Z0-9])\s{2}-\s(.*)$/;

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

function normalizeMonth(da: string): string | undefined {
  const m = da.match(/^[A-Z]{3}/);
  return m ? MONTHS[m[0]] : undefined;
}

export const parseRIS = (text: string): ParsedLiterature[] => {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");

  const records: ParsedLiterature[] = [];
  let current: Record<string, string[]> | null = null;

  for (const line of lines) {
    const match = line.match(RIS_LINE_RE);
    if (!match) continue;

    const [, tag, value] = match;

    if (tag === "ER") {
      if (current) {
        records.push(buildRecord(current));
        current = null;
      }
      continue;
    }

    if (tag === "TY") {
      if (current) {
        records.push(buildRecord(current));
      }
      current = { [tag]: [value] };
      continue;
    }

    if (!current) continue;

    if (current[tag]) {
      current[tag].push(value);
    } else {
      current[tag] = [value];
    }
  }

  if (current) {
    records.push(buildRecord(current));
  }

  return records;
};

function buildRecord(fields: Record<string, string[]>): ParsedLiterature {
  const authors =
    fields["AU"]
      ?.map((a) => a.trim())
      .filter(Boolean)
      .join("; ") ?? null;
  const doi = fields["DO"]?.[0] ?? fields["DI"]?.[0] ?? null;
  const da = fields["DA"]?.[0] ?? "";
  const month = normalizeMonth(da);

  return {
    publicationType: fields["TY"]?.[0] ?? null,
    doi,
    title: fields["TI"]?.join(" ") ?? "",
    abstract: fields["AB"]?.join(" ") ?? "",
    authors,
    journal: fields["T2"]?.[0] ?? fields["JO"]?.[0] ?? fields["JF"]?.[0] ?? null,
    issn: fields["SN"]?.[0] ?? null,
    publicationMonth: month ?? null,
    publicationYear: fields["PY"]?.[0] ?? null,
    volume: fields["VL"]?.[0] ?? null,
    issue: fields["IS"]?.[0] ?? null,
    articleNumber: fields["C7"]?.[0] ?? null,
    accessionNumber: fields["AN"]?.[0] ?? null,
  };
}
