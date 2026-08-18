import { expect, test } from "vite-plus/test";

import { extractDoiFromText } from "../src/extract-doi.ts";

test("extractDoiFromText finds bare doi", () => {
  expect(extractDoiFromText("See 10.1000/xyz123 for details.")).toBe("10.1000/xyz123");
});

test("extractDoiFromText finds doi.org url", () => {
  expect(extractDoiFromText("https://doi.org/10.1038/s41586-020-2649-2")).toBe(
    "10.1038/s41586-020-2649-2",
  );
});

test("extractDoiFromText finds doi: prefix", () => {
  expect(extractDoiFromText("DOI: 10.1000/ABC.DEF")).toBe("10.1000/abc.def");
});

test("extractDoiFromText strips trailing punctuation", () => {
  expect(extractDoiFromText("Published as 10.1000/xyz.")).toBe("10.1000/xyz");
  expect(extractDoiFromText("(10.1000/xyz)")).toBe("10.1000/xyz");
});

test("extractDoiFromText returns null when missing", () => {
  expect(extractDoiFromText("no identifier here")).toBeNull();
  expect(extractDoiFromText("")).toBeNull();
});
