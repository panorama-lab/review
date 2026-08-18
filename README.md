# @panorama-lab/review

Directory-based literature review format and helpers.

See [SPEC.md](./SPEC.md) for the on-disk review layout.

## Parsing imports

```ts
import { parseBibTeX, parseRIS } from "@panorama-lab/review";

const fromBib = parseBibTeX(bibText);
const fromRis = parseRIS(risText);
```

## DOI helpers

```ts
import {
  extractDoiFromPdf,
  extractDoiFromText,
  normalizeDoi,
  paperIdFromDoi,
} from "@panorama-lab/review";

const doi = normalizeDoi("https://doi.org/10.1000/xyz");
const paperId = await paperIdFromDoi(doi);

const fromText = extractDoiFromText("See https://doi.org/10.1000/xyz");
const fromPdf = await extractDoiFromPdf("/path/to/paper.pdf");
```

`extractDoiFromPdf` parses pages 1–2 with `@llamaindex/liteparse` and finds a DOI via regex.

## Development

```bash
vp install
vp test
vp pack
```
