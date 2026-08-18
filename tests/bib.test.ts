import { expect, test } from "vite-plus/test";

import { parseBibTeX } from "../src/bib.ts";

test("parseBibTeX parses a journal article", () => {
  const records = parseBibTeX(`
@article{smith2021example,
  title = {Example {Title} of a Study},
  author = {Smith, Jane and Doe, John},
  journal = {Journal of Example},
  year = {2021},
  month = mar,
  volume = {12},
  number = {3},
  pages = {1--10},
  doi = {10.1000/xyz},
  issn = {1234-5678},
  abstract = {This is the abstract.},
  eid = {e123}
}
`);

  expect(records).toHaveLength(1);
  expect(records[0]).toEqual({
    publicationType: "article",
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
    accessionNumber: "smith2021example",
  });
});

test("parseBibTeX supports quoted fields and numeric month", () => {
  const records = parseBibTeX(`
@inproceedings{conf2020,
  title = "Quoted Title",
  author = "Alice and Bob",
  booktitle = "Proceedings of Example",
  year = "2020-05",
  month = "7",
  articleno = "42"
}
`);

  expect(records).toHaveLength(1);
  expect(records[0].title).toBe("Quoted Title");
  expect(records[0].authors).toBe("Alice; Bob");
  expect(records[0].journal).toBe("Proceedings of Example");
  expect(records[0].publicationYear).toBe("2020");
  expect(records[0].publicationMonth).toBe("07");
  expect(records[0].articleNumber).toBe("42");
  expect(records[0].accessionNumber).toBe("conf2020");
});

test("parseBibTeX skips comment preamble and string entries", () => {
  const records = parseBibTeX(`
@comment{ignore me}
@preamble{"\\\\newcommand{\\\\foo}{bar}"}
@string{jex = "Journal of Example"}
@article{keep,
  title = {Keep Me},
  year = {2019}
}
`);

  expect(records).toHaveLength(1);
  expect(records[0].title).toBe("Keep Me");
  expect(records[0].publicationYear).toBe("2019");
});

test("parseBibTeX handles nested braces and multiple entries", () => {
  const records = parseBibTeX(`
@article{a1,
  title = {{Nested} {Braces} Title},
  author = {One, A}
}
@book{b2,
  title = {Book Title},
  author = {Two, B},
  year = {2018}
}
`);

  expect(records).toHaveLength(2);
  expect(records[0].title).toBe("Nested Braces Title");
  expect(records[0].publicationType).toBe("article");
  expect(records[1].title).toBe("Book Title");
  expect(records[1].publicationType).toBe("book");
  expect(records[1].accessionNumber).toBe("b2");
});

test("parseBibTeX returns empty array for empty input", () => {
  expect(parseBibTeX("")).toEqual([]);
  expect(parseBibTeX("not a bib file")).toEqual([]);
});
