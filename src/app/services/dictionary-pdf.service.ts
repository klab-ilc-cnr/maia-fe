import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { TreeNode } from 'primeng/api';
import { decode } from 'html-entities';
import htmlToPdfmake from 'html-to-pdfmake';
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { DictionaryEntry } from '../models/dictionary/dictionary-entry.model';
import { DictionaryNoteVocabo } from '../models/custom-models/dictionary-note-vocabo';
import { DictionaryPreviewItem } from '../models/dictionary/dictionary-preview-item.model';
import { LinguisticRelationModel } from '../models/lexicon/linguistic-relation.model';
import { SearchAnnotationResultRow } from '../models/search/search-annotation-result';
import type { Content } from 'pdfmake/interfaces';

if (typeof (pdfFonts as any).pdfMake !== 'undefined') {
  (pdfMake as any).vfs = (pdfFonts as any).pdfMake.vfs;
} else if (typeof (pdfFonts as any).default?.pdfMake !== 'undefined') {
  (pdfMake as any).vfs = (pdfFonts as any).default.pdfMake.vfs;
}

export interface DictionaryPreviewPdfData {
  entry: DictionaryEntry;
  posAndTraits: string;
  structuredNote: DictionaryNoteVocabo;
  forms: { pos: string; label: string }[];
  firstAttestationLabel: string;
  totalOccurrences: number;
  frequencies: { documentLabel: string; frequency: number }[];
  senseLexicalEntriesTree: TreeNode<DictionaryPreviewItem>[];
  orderedSeeAlso: LinguisticRelationModel[];
}

@Injectable({
  providedIn: 'root'
})
export class DictionaryPdfService {

  constructor(private translate: TranslateService) {}

  /**
   * Generate and download a PDF of the dictionary entry preview.
   */
  generatePreviewPdf(data: DictionaryPreviewPdfData): void {
    if (!data?.entry) return;
    const docDef = this.buildDocumentDefinition(data);
    const fileName = `dictionary-entry-${(data.entry.label || 'entry').replace(/\s+/g, '-')}.pdf`;
    (pdfMake as any).createPdf(docDef).download(fileName);
  }

  private buildDocumentDefinition(data: DictionaryPreviewPdfData): Record<string, unknown> {
    const content: Content[] = [];
    const note = data.structuredNote ?? ({} as DictionaryNoteVocabo);

    // Header: label, POS/traits, status
    content.push({
      text: [
        { text: data.entry.label || '', bold: true, fontSize: 14 },
        { text: ` ${data.posAndTraits || ''}`, fontSize: 9 }
      ],
      marginBottom: 4
    });
    content.push({
      text: data.entry.status ? this.translate.instant(data.entry.status) : '',
      fontSize: 10,
      marginBottom: 12
    });

    // Entry header section title
    const entryHeaderLabel = this.translate.instant('DICTIONARY_EDITOR.PREVIEW_TAB.entryHeader');
    content.push({ text: entryHeaderLabel, style: 'sectionHeader', marginTop: 8 });
    content.push({ text: '', marginBottom: 4 });

    const formsLabel = this.translate.instant('DICTIONARY_EDITOR.PREVIEW_TAB.forms');
    const firstAttestLabel = this.translate.instant('DICTIONARY_EDITOR.EDIT_TAB.firstAttestBocc');
    const topoLabel = this.translate.instant('DICTIONARY_EDITOR.EDIT_TAB.topographicReference');
    const nOccDecLabel = this.translate.instant('DICTIONARY_EDITOR.EDIT_TAB.nOccurrencesDecameron');
    const nTotalLabel = this.translate.instant('DICTIONARY_EDITOR.EDIT_TAB.nTotalOccurrences');
    const occOtherLabel = this.translate.instant('DICTIONARY_EDITOR.EDIT_TAB.occOtherWorks');
    const etymLabel = this.translate.instant('DICTIONARY_EDITOR.EDIT_TAB.etymology');
    const sourceLangLabel = this.translate.instant('DICTIONARY_EDITOR.EDIT_TAB.sourceLanguage');
    const etymonLabel = this.translate.instant('DICTIONARY_EDITOR.EDIT_TAB.etymon');
    const detailsLabel = this.translate.instant('DICTIONARY_EDITOR.EDIT_TAB.details');
    const lingSemLabel = this.translate.instant('DICTIONARY_EDITOR.EDIT_TAB.linguisticSemanticComm');
    const aroundDecLabel = this.translate.instant('DICTIONARY_EDITOR.EDIT_TAB.aroundDecameron');
    const firstAbsLabel = this.translate.instant('DICTIONARY_EDITOR.EDIT_TAB.firstAttestAbs');
    const vocsLabel = this.translate.instant('DICTIONARY_EDITOR.EDIT_TAB.vocs');
    const miscLabel = this.translate.instant('DICTIONARY_EDITOR.EDIT_TAB.misc');
    const seeAlsoLabel = this.translate.instant('DICTIONARY_EDITOR.EDIT_TAB.seeAlso');
    const noDefLabel = this.translate.instant('DICTIONARY_EDITOR.SORT_TAB.noDefinition');
    const textColLabel = this.translate.instant('DICTIONARY_EDITOR.PREVIEW_TAB.text');
    const refColLabel = this.translate.instant('DICTIONARY_EDITOR.PREVIEW_TAB.reference');
    const sectionColLabel = this.translate.instant('DICTIONARY_EDITOR.PREVIEW_TAB.section');
    const noResultLabel = this.translate.instant('GENERAL.noResult');

    // Forms (data.forms may be empty)
    content.push({ text: `${formsLabel}:`, style: 'fieldLabel' });
    if (data.forms?.length) {
      content.push({
        text: data.forms.map(f => `${f.label} (${f.pos})`).join(', '),
        marginBottom: 6
      });
    } else {
      content.push({ text: '', marginBottom: 6 });
    }

    // First attestation, topographic reference, occurrences
    content.push({
      columns: [
        { width: '*', text: [{ text: `${firstAttestLabel}: `, bold: true }, { text: data.firstAttestationLabel || '' }], marginBottom: 4 },
        { width: '*', text: [{ text: `${topoLabel}: `, bold: true }, { text: note.firstAttestationDetails ?? '' }], marginBottom: 4 }
      ]
    });
    content.push({
      columns: [
        { width: '*', text: [{ text: `${nOccDecLabel}: `, bold: true }, { text: String(note.decameronOccurrences ?? 0) }], marginBottom: 4 },
        { width: '*', text: [{ text: `${nTotalLabel}: `, bold: true }, { text: String(data.totalOccurrences ?? 0) }], marginBottom: 4 }
      ]
    });

    // Occorrenze altre opere
    if (data.frequencies?.length) {
      content.push({ text: occOtherLabel, style: 'fieldsetTitle', marginTop: 8 });
      data.frequencies.forEach(f => {
        content.push({ text: [{ text: `${f.documentLabel}: `, italics: true }, { text: String(f.frequency), italics: true }], marginLeft: 8, marginBottom: 2 });
      });
      content.push({ text: '', marginBottom: 6 });
    }

    // Etymology
    if (note.etymology) {
      content.push({ text: etymLabel, style: 'fieldsetTitle', marginTop: 8 });
      content.push({ text: `${sourceLangLabel}: ${note.etymology.language || ''}`, marginLeft: 8, marginBottom: 2 });
      content.push({ text: `${etymonLabel}: ${note.etymology.etymon || ''}`, marginLeft: 8, marginBottom: 4 });
      if (note.etymology.details) {
        content.push({ text: `${detailsLabel}:`, marginLeft: 8, marginBottom: 2 });
        const detailsContent = this.htmlToContent(note.etymology.details);
        content.push({ stack: detailsContent, marginLeft: 8, marginBottom: 6 });
      }
    }

    // Rich text fields (Quill HTML)
    const richFields: { label: string; html: string }[] = [
      { label: lingSemLabel, html: note.linguisticsSemantics ?? '' },
      { label: aroundDecLabel, html: note.decameron ?? '' },
      { label: firstAbsLabel, html: note.firstAbsAttestation ?? '' },
      { label: 'Boccaccio e Dante', html: note.boccaccioDante ?? '' },
      { label: vocsLabel, html: note.crusche ?? '' },
      { label: miscLabel, html: note.polyrhematics ?? '' }
    ];
    richFields.forEach(({ label, html }) => {
      if (label) content.push({ text: label, style: 'fieldLabel', marginTop: 6 });
      if (html) content.push({ stack: this.htmlToContent(html), marginBottom: 4 });
    });

    // See also
    if (data.orderedSeeAlso?.length) {
      content.push({ text: seeAlsoLabel, style: 'fieldsetTitle', marginTop: 8 });
      data.orderedSeeAlso.forEach(s => {
        const line = [s.label ? `${s.label} - ` : '', s.entity ? { text: s.entity, italics: true } : ''].filter(Boolean);
        if (line.length) content.push({ text: line, marginLeft: 8, marginBottom: 2 });
      });
      content.push({ text: '', marginBottom: 8 });
    }

    // Entry body section
    const entryBodyLabel = this.translate.instant('DICTIONARY_EDITOR.PREVIEW_TAB.entryBody');
    content.push({ text: entryBodyLabel, style: 'sectionHeader', marginTop: 12 });
    content.push({ text: '', marginBottom: 4 });

    // Tree: sense lexical entries -> meanings -> annotation tables
    const bodyContent = this.buildTreeContent(data.senseLexicalEntriesTree, noDefLabel, textColLabel, refColLabel, sectionColLabel, noResultLabel);
    content.push(...bodyContent);

    const styles: Record<string, { fontSize?: number; bold?: boolean; marginBottom?: number }> = {
      sectionHeader: { fontSize: 12, bold: true, marginBottom: 4 },
      fieldLabel: { fontSize: 10, bold: true },
      fieldsetTitle: { fontSize: 10, bold: true }
    };

    return {
      content,
      styles,
      defaultStyle: { fontSize: 10 }
    };
  }

  private decodeHtmlEntities(html: string): string {
    if (!html || typeof html !== 'string') return '';
    let decoded = decode(html);
    // Handle double-encoded entities (e.g. from API)
    if (decoded.includes('&lt;') || decoded.includes('&gt;') || decoded.includes('&amp;')) {
      decoded = decode(decoded);
    }
    return decoded;
  }

  private stripHtml(html: string): string {
    if (!html || typeof html !== 'string') return '';
    const decoded = this.decodeHtmlEntities(html);
    return decoded.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  private htmlToContent(html: string): Content[] {
    if (!html || typeof html !== 'string') return [];
    const decoded = this.decodeHtmlEntities(html);
    try {
      const parsed = htmlToPdfmake(decoded) as Content | Content[];
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return [{ text: this.stripHtml(decoded) }];
    }
  }

  /**
   * Returns inline text runs from HTML for use inside a composite text array (e.g. with index + prefix + definition).
   */
  private getInlineRunsFromHtml(html: string): Content[] {
    if (!html || typeof html !== 'string') return [];
    const decoded = this.decodeHtmlEntities(html);
    try {
      const parsed = htmlToPdfmake(decoded) as Content | Content[];
      const block = Array.isArray(parsed) ? parsed[0] : parsed;
      const text = block && typeof block === 'object' && (block as any).text;
      if (Array.isArray(text)) return text as Content[];
      if (typeof text === 'string') return [{ text }];
      return [{ text: this.stripHtml(decoded) }];
    } catch {
      return [{ text: this.stripHtml(decoded) }];
    }
  }

  private buildTreeContent(
    nodes: TreeNode<DictionaryPreviewItem>[],
    noDefLabel: string,
    textColLabel: string,
    refColLabel: string,
    sectionColLabel: string,
    noResultLabel: string
  ): Content[] {
    const result: Content[] = [];
    if (!nodes?.length) return result;

    const visit = (node: TreeNode<DictionaryPreviewItem>, depth: number) => {
      const d = node.data;
      const marginLeft = 8 + depth * 8;

      if (node.type === 'senseLexicalEntry' && d) {
        const suffix = (d.suffix && d.suffix.length) ? ` ${d.suffix.join(' ')}` : '';
        result.push({
          text: [{ text: (node.label || '') + suffix, bold: true }],
          marginLeft,
          marginBottom: 4
        });
      } else if (node.type === 'meaning' && d) {
        const indexPart = d.index ? `${d.index}. ` : '';
        const prefixPart = (d.prefix && d.prefix.length) ? [{ text: `[${d.prefix.join(' ')}] `, italics: true }] : [];
        const labelRuns = d.label ? this.getInlineRunsFromHtml(d.label) : [{ text: noDefLabel }];
        result.push({
          text: [{ text: indexPart, bold: true }, ...prefixPart, ...labelRuns],
          marginLeft,
          marginBottom: 4
        });
      } else if (node.type === 'annotation' && d?.searchAnnotation) {
        const ann = d.searchAnnotation;
        const rows = ann.data;
        if (rows?.length) {
          const headerRow = [textColLabel, refColLabel, sectionColLabel];
          const bodyRows = rows.map((row: SearchAnnotationResultRow) => [
            row.text || '',
            row.reference || '',
            this.annotationSectionToContent(row)
          ]);
          result.push({
            table: {
              headerRows: 1,
              widths: ['auto', 'auto', '*'],
              body: [headerRow, ...bodyRows]
            },
            layout: 'lightHorizontalLines',
            marginLeft,
            marginBottom: 8
          });
        } else {
          result.push({ text: noResultLabel, marginLeft, marginBottom: 4, italics: true });
        }
      }

      (node.children || []).forEach(child => visit(child, depth + 1));
    };

    nodes.forEach(n => visit(n, 0));
    return result;
  }

  private annotationSectionToContent(row: SearchAnnotationResultRow): Content {
    const section = row.section || '';
    const offsets = row.offsets || [];
    if (!section || !offsets.length) return { text: section };
    const sorted = [...offsets].sort((a, b) => a.start - b.start);
    let last = 0;
    const parts: Content[] = [];
    for (const { start, end } of sorted) {
      if (start >= end || start < last) continue;
      if (start > last) parts.push({ text: section.substring(last, start) });
      parts.push({ text: section.substring(start, end), bold: true, background: '#ffff00' });
      last = end;
    }
    if (last < section.length) parts.push({ text: section.substring(last) });
    return { text: parts } as Content;
  }
}
