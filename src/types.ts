export type ParsedLiterature = {
  publicationType: string | null;
  doi: string | null;
  title: string;
  abstract: string;
  authors: string | null;
  journal: string | null;
  issn: string | null;
  publicationMonth: string | null;
  publicationYear: string | null;
  volume: string | null;
  issue: string | null;
  articleNumber: string | null;
  accessionNumber: string | null;
};
