import { TextualDocument } from "../models/dictionary/textual-document.model";

/** One row of "occurrences in other works" ready to be shown (preview and PDF). */
export interface OtherWorkFrequency {
  documentLabel: string;
  frequency: number;
}

/**
 * Rows of "occurrences in other works" of a dictionary entry, for display only (the saved note is not touched):
 * - ordered by the `order` column of the works list (ascending);
 * - the empty rows (no work and no number: a "+" pressed and never filled in) are left out;
 * - a work missing from the list (e.g. removed from the backend) goes at the end, ordered by code; its code is
 *   shown as label so the number does not appear without a name.
 * Equal order: the order of the note is kept (the sort is stable).
 */
export function orderOtherWorksFrequencies(
  frequencies: { documentId: string; frequency: number }[],
  documents: TextualDocument[]
): OtherWorkFrequency[] {
  const rows = frequencies
    .filter(f => !!f.documentId || !!f.frequency)
    .map(f => {
      const doc = documents.find(d => d.code === f.documentId);
      return {
        code: f.documentId ?? '',
        order: typeof doc?.order === 'number' ? doc.order : Number.POSITIVE_INFINITY,
        documentLabel: doc?.title || f.documentId || '',
        frequency: f.frequency,
      };
    });
  rows.sort((a, b) => a.order === b.order
    ? (a.order === Number.POSITIVE_INFINITY ? a.code.localeCompare(b.code) : 0)
    : a.order - b.order);
  return rows.map(({ documentLabel, frequency }) => ({ documentLabel, frequency }));
}
