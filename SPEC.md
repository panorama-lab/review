# Panorama Review Specification

Portable, agent-readable representation of one systematic literature review on disk

## Overview

A review is a single directory. Config, imports, papers, sessions, resolutions, and agent instructions live in that tree. Plain text formats (JSON, JSONL, Markdown) are preferred so tools and agents can read and write without a database.

### Goals

- Represent a complete review as one directory tree.
- Make common operations trivial: open review, list papers, create session, decide include/exclude, code fields, resolve conflicts.
- Keep writes small and local (append one decision line; do not rewrite large blobs).
- Support the workflow: import → title/abstract screen → full-text retrieve → full-text screen → coding, with multi-screener conflict resolution.
- Stay portable and git-friendly.

## Stages

| Stage id              | Role                                                            |
| --------------------- | --------------------------------------------------------------- |
| `import`              | Databases / search exports loaded into the review               |
| `title-abstract`      | Title & abstract screening sessions                             |
| `full-text`           | Full-text retrieval (attach PDF / parsed text)                  |
| `full-text-screening` | Full-text screening sessions (session folder name: `full-text`) |
| `coding`              | Data extraction / coding sessions                               |

Session directories:

- `sessions/title-abstract/{session_id}/`
- `sessions/full-text/{session_id}/`
- `sessions/coding/{session_id}/`

Eligibility of a paper for a later stage is **derived**, not stored.

## Directory layout

```text
{review-root}/
├── AGENTS.md                      # how agents should work in this review
├── REVIEW.md                      # human + agent narrative protocol
├── review.json                    # structured review config (machine source of truth)
├── imports/
│   ├── index.json                 # ordered list of imports
│   └── {import_id}/
│       ├── meta.json
│       └── source.ris | source.bib | source.bibtex
├── papers/
│   ├── index.jsonl                # compact catalog for listing/filtering
│   └── {literature_id}/
│       ├── meta.json
│       ├── abstract.md
│       ├── fulltext.pdf           # optional
│       ├── fulltext.md            # optional parsed text for agents
│       └── notes.md               # optional freeform notes
├── sessions/
│   ├── title-abstract/
│   │   └── {session_id}/
│   │       ├── session.json
│   │       └── decisions.jsonl
│   ├── full-text/
│   │   └── {session_id}/
│   │       ├── session.json
│   │       └── decisions.jsonl
│   └── coding/
│       └── {session_id}/
│           ├── session.json
│           └── decisions.jsonl
├── resolutions/
│   ├── title-abstract.jsonl
│   ├── full-text.jsonl
│   └── coding.jsonl
└── .literature/
    ├── format.json                # format version + tool metadata
    └── cache/                     # optional derived indexes (regenerable)
        └── status.json
```

### Root marker

A directory is a literature review if it contains both:

- `review.json`
- `.literature/format.json`

`AGENTS.md` and `REVIEW.md` are required for new reviews; older imports may regenerate them.

## File formats and schemas

Conventions:

- UTF-8, LF newlines.
- JSON objects use `snake_case` keys.
- Timestamps are ISO-8601 UTC (`2026-07-28T12:34:56.789Z`).
- Booleans and nulls are JSON native types.
- Unknown fields must be ignored by readers (forward compatible).
- Writers must preserve unknown fields they did not intentionally change.

### `.literature/format.json`

```json
{
  "format": "literature-review",
  "version": "0.1.0",
  "created_at": "2026-07-28T10:00:00.000Z",
  "updated_at": "2026-07-28T10:00:00.000Z",
  "created_by": "review-desktop@0.1.0"
}
```

### `review.json`

Machine-readable review config. Prefer this over parsing `REVIEW.md` for structured fields.

```json
{
  "id": "review_01hxyz…",
  "name": "Exercise interventions for frailty",
  "open_url": "https://libkey.io/",
  "coding_schema": ["population", "intervention", "comparator", "outcome", "study_design"],
  "inclusion_criteria": ["Peer-reviewed empirical study", "Adults 65+"],
  "exclusion_criteria": ["Protocol or abstract-only with no full text", "Not frailty-related"],
  "created_at": "2026-07-28T10:00:00.000Z",
  "updated_at": "2026-07-28T10:00:00.000Z"
}
```

| Field                       | Required | Notes                                                         |
| --------------------------- | -------- | ------------------------------------------------------------- |
| `id`                        | yes      | Stable review id (typeid or uuid). Directory name may differ. |
| `name`                      | yes      | Display name                                                  |
| `open_url`                  | no       | Library OpenURL / resolver base for full-text retrieval       |
| `coding_schema`             | yes      | Ordered list of coding field names (may be `[]`)              |
| `inclusion_criteria`        | no       | Free text list for agents/humans                              |
| `exclusion_criteria`        | no       | Free text list for agents/humans                              |
| `created_at` / `updated_at` | yes      |                                                               |

### `REVIEW.md`

Human- and agent-oriented protocol document. Suggested structure:

```markdown
# {Review name}

## Objective

…

## Inclusion criteria

- …

## Exclusion criteria

- …

## Screening notes

…

## Coding notes

…

## Status

- Import: …
- Title/abstract: …
- Full text: …
- Coding: …
```

Treat `review.json` as authoritative for machine fields and `REVIEW.md` as guidance / protocol prose. When updating criteria, write both if possible.

### `AGENTS.md`

Instructions for coding agents operating on this review. Seed a default when creating a review. Agents should read this file first after opening the review root.

### Imports

#### `imports/index.json`

```json
{
  "imports": [
    {
      "id": "imp_01h…",
      "name": "PubMed",
      "path": "imports/imp_01h…",
      "source_file": "source.ris",
      "imported_at": "2026-07-28T10:05:00.000Z"
    }
  ]
}
```

#### `imports/{import_id}/meta.json`

```json
{
  "id": "imp_01h…",
  "name": "PubMed",
  "source_file": "source.ris",
  "original_path": "/Users/…/pubmed-export.ris",
  "format": "ris",
  "imported_at": "2026-07-28T10:05:00.000Z",
  "counts": {
    "records": 120,
    "linked": 120,
    "duplicated": 8
  }
}
```

Keep a copy of the original export as `source.ris` / `source.bib` / `source.bibtex` so the review is self-contained.

Supported import formats: RIS, BibTeX (`.bib`, `.bibtex`).

### Papers

#### `papers/index.jsonl`

One JSON object per line. List and filter papers from this file without walking every subdirectory.

```json
{"id":"lit_01h…","title":"…","doi":"10.1000/xyz","year":"2021","import_id":"imp_01h…","is_duplicated":false,"has_fulltext":true,"has_parsed_fulltext":true}
{"id":"lit_01i…","title":"…","doi":null,"year":"2019","import_id":"imp_01h…","is_duplicated":true,"has_fulltext":false,"has_parsed_fulltext":false}
```

Rules:

- Exactly one line per paper directory under `papers/`.
- When a paper is added/updated, rewrite that paper’s line (or regenerate the whole index).
- `is_duplicated` is review-scoped (DOI collision within the review / import).
- Duplicated papers remain on disk for provenance but are **excluded** from screening pools.

#### `papers/{literature_id}/meta.json`

```json
{
  "id": "lit_01h…",
  "import_id": "imp_01h…",
  "is_duplicated": false,
  "publication_type": "journal-article",
  "doi": "10.1000/xyz",
  "title": "Example title",
  "authors": "Doe J; Smith A",
  "journal": "Journal of Example",
  "issn": "1234-5678",
  "publication_month": "03",
  "publication_year": "2021",
  "volume": "12",
  "issue": "3",
  "article_number": null,
  "accession_number": "PMID:12345",
  "source": "ris",
  "fulltext": {
    "pdf": "fulltext.pdf",
    "parsed": "fulltext.md",
    "retrieved_at": "2026-07-28T11:00:00.000Z"
  },
  "created_at": "2026-07-28T10:05:01.000Z",
  "updated_at": "2026-07-28T11:00:00.000Z"
}
```

| Field                              | Required | Notes                                             |
| ---------------------------------- | -------- | ------------------------------------------------- |
| `id`                               | yes      | Must match directory name                         |
| `import_id`                        | yes      | Owning import                                     |
| `is_duplicated`                    | yes      | Default `false`                                   |
| `title`                            | yes      |                                                   |
| `doi`                              | no       | Normalized string without URL prefix when present |
| bibliographic fields               | no       | Authors, journal, volume, issue, etc.             |
| `fulltext.pdf` / `fulltext.parsed` | no       | Relative paths inside the paper directory         |

#### `papers/{literature_id}/abstract.md`

Plain Markdown (usually a single paragraph). Empty file allowed when abstract is missing.

#### `papers/{literature_id}/fulltext.pdf`

Binary PDF when retrieved. Prefer this fixed name over title-based filenames.

#### `papers/{literature_id}/fulltext.md`

Optional plain-text / Markdown extraction of the PDF for agent screening and coding. When present, prefer reading `fulltext.md` over binary PDF.

#### `papers/{literature_id}/notes.md`

Optional freeform notes. Not used for automated conflict logic.

### Sessions

#### `sessions/{stage}/{session_id}/session.json`

```json
{
  "id": "ses_01h…",
  "name": "Sam",
  "stage": "title-abstract",
  "created_at": "2026-07-28T12:00:00.000Z",
  "updated_at": "2026-07-28T12:00:00.000Z",
  "created_by": "agent"
}
```

| Field        | Required | Notes                                       |
| ------------ | -------- | ------------------------------------------- |
| `id`         | yes      | Must match directory name                   |
| `name`       | yes      | Screener / rater display name               |
| `stage`      | yes      | `title-abstract` \| `full-text` \| `coding` |
| `created_by` | no       | e.g. `ui`, `cli`, `agent`                   |

Creating a session:

```bash
mkdir -p sessions/title-abstract/ses_01h…
# write session.json
# create empty decisions.jsonl
```

No need to pre-populate decisions for every paper. Missing decision ⇒ `todo`.

#### `sessions/{stage}/{session_id}/decisions.jsonl`

Append-friendly decision log. **Last write for a given `literature_id` wins.**

Screening decision (`title-abstract` or `full-text`):

```json
{"literature_id":"lit_01h…","included":true,"at":"2026-07-28T12:01:00.000Z","by":"agent"}
{"literature_id":"lit_01i…","included":false,"reason":"Wrong population","at":"2026-07-28T12:02:00.000Z","by":"agent"}
```

Coding decision (`coding`):

```json
{
  "literature_id": "lit_01h…",
  "coding": {
    "population": "community-dwelling adults 65+",
    "intervention": "resistance training",
    "outcome": "frailty index"
  },
  "at": "2026-07-28T13:00:00.000Z",
  "by": "agent"
}
```

| Field           | Required       | Notes                                                                           |
| --------------- | -------------- | ------------------------------------------------------------------------------- |
| `literature_id` | yes            |                                                                                 |
| `included`      | screening only | boolean                                                                         |
| `coding`        | coding only    | object of string field → string value; keys should be subset of `coding_schema` |
| `reason`        | no             | free text exclusion / note                                                      |
| `at`            | yes            | timestamp                                                                       |
| `by`            | no             | actor label                                                                     |

Soft constraints (tools may warn, not hard-fail):

- Screening sessions should not write `coding`.
- Coding sessions should not write `included`.
- Prefer only coding keys listed in `review.json` `coding_schema`.

### Resolutions

When multiple sessions disagree, a resolver writes to `resolutions/{stage}.jsonl`.

Stages:

- `resolutions/title-abstract.jsonl`
- `resolutions/full-text.jsonl`
- `resolutions/coding.jsonl`

Screening resolution:

```json
{
  "literature_id": "lit_01h…",
  "included": true,
  "at": "2026-07-28T14:00:00.000Z",
  "by": "resolver"
}
```

Coding resolution:

```json
{
  "literature_id": "lit_01h…",
  "coding": { "population": "…", "intervention": "…" },
  "at": "2026-07-28T14:05:00.000Z",
  "by": "resolver"
}
```

**Last line for a `literature_id` wins.** Resolutions override session agreement logic for that paper.

## Identity and naming

### IDs

- Prefer [TypeID](https://github.com/jetify-com/typeid)-style prefixed ids for readability:
  - `review_…`, `imp_…`, `lit_…`, `ses_…`
- IDs are opaque; do not encode title/DOI into the id.
- Directory names **must equal** the entity id for papers, imports, and sessions.

### Paths

- Always use relative paths inside the review root.
- Do not store absolute machine paths in fields tools rely on (`fulltext.pdf` is relative to the paper dir). `imports/*/meta.json` may record `original_path` for provenance only.

### Paper directory names

`papers/{literature_id}/` only — never title-based folder names.

## Workflow semantics

### Import pool

All papers in `papers/index.jsonl`.

### Title–abstract screening pool

All papers where `is_duplicated == false`.

### Title–abstract final inclusion

For each paper in the title–abstract pool:

1. If a resolution exists in `resolutions/title-abstract.jsonl`, use its `included`.
2. Else if every session under `sessions/title-abstract/*` has a decision for the paper and all agree, use that agreed value.
3. Else the paper is not yet decided for downstream stages.

Included set = papers whose final `included` is `true`.

### Full-text retrieval pool

Title–abstract final included papers.

A paper counts as retrieved when `papers/{id}/fulltext.pdf` exists (or `meta.json` `fulltext.pdf` points to an existing file).

### Full-text screening pool

Papers in the full-text retrieval pool that have a full text file.

Final inclusion uses the same resolution/agreement rules on `sessions/full-text/*` and `resolutions/full-text.jsonl`.

### Coding pool

Full-text screening final included papers.

A coding decision is “complete” when the effective coding object is non-empty (after last-write-wins). Conflict when ≥2 sessions have non-empty coding objects that are not deep-equal (stable key sort). Resolutions in `resolutions/coding.jsonl` override.

### Conflicts (derived, not stored)

Do not persist conflict lists. Tools recompute:

- Screening conflict: ≥2 sessions decided, values disagree, and no resolution yet.
- Coding conflict: ≥2 sessions coded, coding signatures disagree, and no resolution yet.

Optional cache: `.literature/cache/status.json` may store counts for UI; always regenerable.

## File operations

Assume cwd is `{review-root}`.

### Open / orient

1. Read `AGENTS.md`
2. Read `review.json`
3. Skim `REVIEW.md` (criteria)
4. Optional: read `.literature/cache/status.json` or recompute from indexes

### Create a screening session

```text
1. Choose stage: title-abstract | full-text | coding
2. Generate session_id (e.g. ses_…)
3. mkdir -p sessions/{stage}/{session_id}
4. Write session.json { id, name, stage, created_at, updated_at, created_by: "agent" }
5. Create empty decisions.jsonl
```

### List todo items for a session

1. Load session from `sessions/{stage}/{session_id}/session.json`
2. Build stage pool (§6)
3. Load last-write-wins map from that session’s `decisions.jsonl`
4. Todo =
   - screening: papers in pool with no `included` boolean yet
   - coding: papers in pool with empty/missing `coding`

For each todo item, read:

- `papers/{id}/meta.json`
- `papers/{id}/abstract.md`
- if full-text or coding stage: prefer `fulltext.md`, else note PDF path

### Record a screening decision

Append one line to the session’s `decisions.jsonl`:

```json
{ "literature_id": "lit_…", "included": false, "reason": "…", "at": "…", "by": "agent" }
```

Do not rewrite the whole file for a single decision. Optionally update `session.json` `updated_at`.

### Record a coding decision

```json
{
  "literature_id": "lit_…",
  "coding": { "population": "…", "intervention": "…" },
  "at": "…",
  "by": "agent"
}
```

Use field names from `review.json` → `coding_schema`.

### Attach full text

1. Copy/save PDF to `papers/{id}/fulltext.pdf`
2. Optionally write `papers/{id}/fulltext.md` (parsed text)
3. Update `meta.json` `fulltext` block and `updated_at`
4. Update the paper’s line in `papers/index.jsonl` (`has_fulltext`, `has_parsed_fulltext`)

### Resolve a conflict

Append to `resolutions/{stage}.jsonl` with the final `included` or `coding`.

### Batch-friendly patterns

- Prefer reading `papers/index.jsonl` then only opening needed paper files.
- Work in small batches (e.g. 10 todos), append decisions, stop for user review.
- Never delete `decisions.jsonl` history casually; supersede with a newer line for the same `literature_id`.
- When regenerating `papers/index.jsonl`, do it as write-temp + atomic rename.

## Default `AGENTS.md` seed

```markdown
# Agent guide for this literature review

## Read first

1. `review.json` — name, coding schema, criteria lists
2. `REVIEW.md` — protocol prose
3. `papers/index.jsonl` — paper catalog

## Create a session

- Path: `sessions/{title-abstract|full-text|coding}/{session_id}/`
- Files: `session.json` + empty `decisions.jsonl`
- `session.json.name` is the screener label (e.g. your agent name)

## Screen (title-abstract / full-text)

- Pool: non-duplicated papers; full-text stage also requires `fulltext.pdf`
- For each todo paper, read `abstract.md` (and `fulltext.md` when screening full text)
- Append one JSON line per decision to `decisions.jsonl`
- Set `included` true/false; optional `reason` on exclude

## Code

- Read `review.json` coding_schema keys
- Prefer `fulltext.md` over PDF
- Append `{ literature_id, coding: {…}, at, by }` lines

## Rules

- Last decision line for a literature_id wins
- Do not edit other sessions' decisions
- Do not store conflicts; recompute from sessions + resolutions
- Keep paths relative; use fixed names `fulltext.pdf` / `fulltext.md`
- Update `papers/index.jsonl` when adding papers or full text
```

## Atomicity and concurrency

- **Append** to `*.jsonl` for decisions/resolutions (single writer preferred).
- For JSON object files (`review.json`, `meta.json`, `session.json`, indexes): write to `*.tmp` then `rename` over the target.
- Multi-writer concurrent writes to the same `decisions.jsonl` are not guaranteed safe; one session should be owned by one process at a time.
- Optional lock file: `.literature/lock.json` with `{ "owner", "pid", "at" }` — advisory only.

## Index maintenance

| Event              | Update                                                                                     |
| ------------------ | ------------------------------------------------------------------------------------------ |
| Import records     | create `papers/{id}/`, append/regenerate `papers/index.jsonl`, update `imports/index.json` |
| Mark duplicate     | `meta.json.is_duplicated`, index line                                                      |
| Attach PDF / parse | paper files + `meta.json` + index flags                                                    |
| Create session     | session directory only                                                                     |
| Decide / code      | append `decisions.jsonl` only                                                              |
| Resolve            | append `resolutions/{stage}.jsonl` only                                                    |
| Rename review      | `review.json` + `REVIEW.md`                                                                |

Optional derived cache `.literature/cache/status.json`:

```json
{
  "generated_at": "…",
  "import": { "total": 120, "duplicated": 8 },
  "title_abstract": { "total": 112, "sessions": 2, "completed": 40, "conflicts": 3 },
  "full_text": { "eligible": 30, "retrieved": 18 },
  "full_text_screening": { "total": 18, "sessions": 1, "completed": 5, "conflicts": 0 },
  "coding": { "total": 10, "sessions": 1, "completed": 2, "conflicts": 0 }
}
```

Regenerate anytime; never required for correctness.

## Minimal valid review

```text
demo-review/
├── AGENTS.md
├── REVIEW.md
├── review.json
├── imports/
│   └── index.json          # { "imports": [] }
├── papers/
│   └── index.jsonl         # empty file
├── sessions/
│   ├── title-abstract/
│   ├── full-text/
│   └── coding/
├── resolutions/
│   ├── title-abstract.jsonl
│   ├── full-text.jsonl
│   └── coding.jsonl
└── .literature/
    └── format.json
```

Empty JSONL files are valid (zero records).

## Example: session and one screening decision

```text
sessions/title-abstract/ses_01agent/
  session.json
  decisions.jsonl
```

`session.json`:

```json
{
  "id": "ses_01agent",
  "name": "screening-agent",
  "stage": "title-abstract",
  "created_at": "2026-07-28T15:00:00.000Z",
  "updated_at": "2026-07-28T15:00:00.000Z",
  "created_by": "agent"
}
```

`decisions.jsonl` after one exclude:

```json
{
  "literature_id": "lit_01h…",
  "included": false,
  "reason": "Pediatric population",
  "at": "2026-07-28T15:01:10.000Z",
  "by": "screening-agent"
}
```

## Key decisions

| Decision         | Choice                                         | Rationale                                          |
| ---------------- | ---------------------------------------------- | -------------------------------------------------- |
| Source of truth  | Directory tree per review                      | Tools and git can read/write the whole project     |
| Catalog format   | `papers/index.jsonl`                           | Streamable, one paper per line, easy partial regen |
| Decisions format | JSONL append, last-write-wins                  | Small writes; history retained without a database  |
| Paper layout     | One folder per literature id                   | Co-locate meta, abstract, PDF, parsed text         |
| Full-text names  | Fixed `fulltext.pdf` / `fulltext.md`           | Stable paths; no title sanitization                |
| Conflicts        | Derived only                                   | Avoid stale conflict state                         |
| Sessions path    | `sessions/{stage}/{id}/`                       | Create sessions with mkdir + two files             |
| Criteria prose   | `REVIEW.md` + optional arrays in `review.json` | Humans edit Markdown; machines read JSON           |
| Agent entrypoint | `AGENTS.md` in review root                     | Same pattern as repo agent guides                  |
