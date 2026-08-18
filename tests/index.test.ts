import { expect, test } from "vite-plus/test";

import { normalizeDoi, paperIdFromDoi, parseBibTeX, parseRIS } from "../src/exports/index.ts";

test("package exports parseBibTeX, parseRIS, and doi helpers", () => {
  expect(typeof parseBibTeX).toBe("function");
  expect(typeof parseRIS).toBe("function");
  expect(typeof normalizeDoi).toBe("function");
  expect(typeof paperIdFromDoi).toBe("function");
  expect(parseBibTeX("@article{a, title = {T}}")).toHaveLength(1);
  expect(parseRIS("TY  - JOUR\nTI  - T\nER  -")).toHaveLength(1);
});
