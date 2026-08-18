import { expect, test } from "vite-plus/test";

import { normalizeDoi, paperIdFromDoi } from "../src/doi.ts";

test("normalizeDoi trims and lowercases", () => {
  expect(normalizeDoi("  10.1000/ABC  ")).toBe("10.1000/abc");
});

test("normalizeDoi strips doi.org urls", () => {
  expect(normalizeDoi("https://doi.org/10.1000/xyz")).toBe("10.1000/xyz");
  expect(normalizeDoi("http://doi.org/10.1000/xyz")).toBe("10.1000/xyz");
  expect(normalizeDoi("https://dx.doi.org/10.1000/xyz")).toBe("10.1000/xyz");
  expect(normalizeDoi("HTTP://DX.DOI.ORG/10.1000/XYZ")).toBe("10.1000/xyz");
});

test("normalizeDoi strips doi: prefix", () => {
  expect(normalizeDoi("doi:10.1000/xyz")).toBe("10.1000/xyz");
  expect(normalizeDoi("DOI:10.1000/XYZ")).toBe("10.1000/xyz");
});

test("normalizeDoi decodes uri components", () => {
  expect(normalizeDoi("10.1000%2Fabc%2Fdef")).toBe("10.1000/abc/def");
  expect(normalizeDoi("https://doi.org/10.1000%2Fabc")).toBe("10.1000/abc");
});

test("paperIdFromDoi returns stable typeid for equivalent dois", async () => {
  const a = await paperIdFromDoi("10.1000/XYZ");
  const b = await paperIdFromDoi("https://doi.org/10.1000/xyz");
  const c = await paperIdFromDoi("doi:10.1000/xyz");

  expect(a).toBe(b);
  expect(a).toBe(c);
  expect(a.startsWith("p_")).toBe(true);
});

test("paperIdFromDoi returns different ids for different dois", async () => {
  const a = await paperIdFromDoi("10.1000/aaa");
  const b = await paperIdFromDoi("10.1000/bbb");
  expect(a).not.toBe(b);
});
