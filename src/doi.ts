import { TypeID } from "typeid-js";

const PAPER_DOI_NAMESPACE = "panorama:paper:doi";

export function normalizeDoi(raw: string) {
  return decodeURIComponent(raw)
    .trim()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, "")
    .replace(/^doi:/i, "")
    .toLowerCase();
}

export async function paperIdFromDoi(raw: string): Promise<string> {
  const doi = normalizeDoi(raw);
  const input = new TextEncoder().encode(`${PAPER_DOI_NAMESPACE}\0${doi}`);
  const hash = new Uint8Array(await crypto.subtle.digest("SHA-256", input));
  return TypeID.fromUUIDBytes("p", hash.subarray(0, 16)).toString();
}
