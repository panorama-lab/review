import { expect, test } from "vite-plus/test";

import { parseRIS } from "../src/exports/index.ts";

test("parseRIS parses a journal article", () => {
  const records = parseRIS(`
TY  - JOUR
AU  - Smith, Jane
AU  - Doe, John
TI  - Example Title of a Study
AB  - This is the abstract.
T2  - Journal of Example
SN  - 1234-5678
PY  - 2021
DA  - MAR 15
VL  - 12
IS  - 3
C7  - e123
DO  - 10.1000/xyz
AN  - PMID:12345
ER  -
`);

  expect(records).toHaveLength(1);
  expect(records[0]).toEqual({
    publicationType: "JOUR",
    doi: "10.1000/xyz",
    title: "Example Title of a Study",
    abstract: "This is the abstract.",
    authors: "Smith, Jane; Doe, John",
    journal: "Journal of Example",
    issn: "1234-5678",
    publicationMonth: "03",
    publicationYear: "2021",
    volume: "12",
    issue: "3",
    articleNumber: "e123",
    accessionNumber: "PMID:12345",
  });
});

test("parseRIS joins multi-line titles and abstracts", () => {
  const records = parseRIS(`
TY  - JOUR
TI  - First line
TI  - Second line
AB  - Abstract part one
AB  - Abstract part two
JO  - Alt Journal
PY  - 2019
ER  -
`);

  expect(records).toHaveLength(1);
  expect(records[0].title).toBe("First line Second line");
  expect(records[0].abstract).toBe("Abstract part one Abstract part two");
  expect(records[0].journal).toBe("Alt Journal");
});

test("parseRIS prefers DO over DI and falls back journal tags", () => {
  const withDo = parseRIS(`
TY  - JOUR
TI  - With DO
DO  - 10.1/a
DI  - 10.1/b
ER  -
`);
  expect(withDo[0].doi).toBe("10.1/a");

  const withDi = parseRIS(`
TY  - JOUR
TI  - With DI
DI  - 10.1/b
ER  -
`);
  expect(withDi[0].doi).toBe("10.1/b");

  const withJf = parseRIS(`
TY  - JOUR
TI  - With JF
JF  - Full Journal
ER  -
`);
  expect(withJf[0].journal).toBe("Full Journal");
});

test("parseRIS parses multiple records and trailing record without ER", () => {
  const records = parseRIS(`
TY  - JOUR
TI  - First
ER  -
TY  - BOOK
TI  - Second
AU  - Author, A
`);

  expect(records).toHaveLength(2);
  expect(records[0].title).toBe("First");
  expect(records[0].publicationType).toBe("JOUR");
  expect(records[1].title).toBe("Second");
  expect(records[1].publicationType).toBe("BOOK");
  expect(records[1].authors).toBe("Author, A");
});

test("parseRIS returns empty array for empty input", () => {
  expect(parseRIS("")).toEqual([]);
  expect(parseRIS("not a ris file")).toEqual([]);
});
