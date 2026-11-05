import { Component, ElementRef, forwardRef, Input, ViewChild, ViewEncapsulation } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Popover } from 'primeng/popover';

/** A special character that can be inserted from the toolbar */
interface SpecialChar {
  char: string;
  /** key of the translated description (RICH_EDITOR.chars.*) */
  key: string;
}

/** Formats of the "other formats" menu, with how to toggle them on Quill */
interface OtherFormat {
  id: string;
  /** key of the translated label (RICH_EDITOR.*) */
  key: string;
  /** Quill format name and value */
  format: 'script' | 'strike' | 'list';
  value: string | boolean;
  /** text of the little preview shown before the label */
  preview: string;
}

/**
 * Rich text (Quill) editor used for the notes / definitions of the application.
 *
 * It wraps the PrimeNG `p-editor` with a reduced toolbar (bold, italic, underline, alignment, link, special characters,
 * other formats, clear formatting) and a whitelist of formats: whatever is not in the toolbar (colours, fonts, headings,
 * images, code...) is dropped when the content is pasted (e.g. from Word or a web page) and when it is loaded in the editor,
 * so notes keep a uniform look. Works as a form control (`ngModel`, `formControlName`).
 *
 * User edits (typing, toolbar actions) dispatch a bubbling DOM `change` event from the host element: the editors that listen
 * with `(change)="onPendingChanges()"` are notified, as they were by the toolbar selects.
 */
@Component({
  selector: 'app-rich-text-editor',
  templateUrl: './rich-text-editor.component.html',
  styleUrls: ['./rich-text-editor.component.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: false,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => RichTextEditorComponent), multi: true }]
})
export class RichTextEditorComponent implements ControlValueAccessor {
  /** Formats accepted by the editor (Quill whitelist): the ones reachable from the toolbar */
  readonly formats = ['bold', 'italic', 'underline', 'strike', 'script', 'link', 'align', 'list'];

  /** Characters used often in the notes (taken from the stored notes: « » ’ – È ...) */
  readonly frequentChars: SpecialChar[] = [
    { char: '«', key: 'laquo' }, { char: '»', key: 'raquo' }, { char: '–', key: 'ndash' },
    { char: 'È', key: 'Egrave' }, { char: '’', key: 'rsquo' },
  ];
  readonly accentedCapitals: SpecialChar[] = [
    { char: 'À', key: 'Agrave' }, { char: 'É', key: 'Eacute' }, { char: 'Ì', key: 'Igrave' },
    { char: 'Ò', key: 'Ograve' }, { char: 'Ù', key: 'Ugrave' },
  ];
  readonly otherChars: SpecialChar[] = [
    { char: '“', key: 'ldquo' }, { char: '”', key: 'rdquo' }, { char: '…', key: 'hellip' }, { char: '—', key: 'mdash' },
  ];

  readonly otherFormats: OtherFormat[] = [
    { id: 'superscript', key: 'superscript', format: 'script', value: 'super', preview: 'x²' },
    { id: 'subscript', key: 'subscript', format: 'script', value: 'sub', preview: 'x₂' },
    { id: 'strike', key: 'strike', format: 'strike', value: true, preview: 'S̶' },
    { id: 'bullet', key: 'bulletList', format: 'list', value: 'bullet', preview: '•' },
    { id: 'ordered', key: 'orderedList', format: 'list', value: 'ordered', preview: '1.' },
  ];

  @Input() placeholder?: string;
  @Input() styleClass?: string;

  @ViewChild('charsPopover') charsPopover?: Popover;
  @ViewChild('formatsPopover') formatsPopover?: Popover;

  value: string | null = null;
  disabled = false;
  /** formats active at the cursor, refreshed when the "other formats" menu opens */
  activeFormats: Record<string, unknown> = {};

  private quill: any;
  private onChange: (value: string | null) => void = () => { };
  private onTouched: () => void = () => { };

  constructor(private readonly host: ElementRef<HTMLElement>) { }

  writeValue(value: string | null): void { this.value = value; }
  registerOnChange(fn: (value: string | null) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.disabled = isDisabled; }

  onEditorInit(event: { editor: any }): void { this.quill = event.editor; }

  /** Text changed by the user (typing, paste, toolbar) */
  onTextChange(event: { htmlValue: string | null }): void {
    this.value = event.htmlValue;
    this.onChange(event.htmlValue);
    this.notifyChange();
  }

  onBlur(): void { this.onTouched(); }

  /** Inserts a special character at the cursor (replacing the selection) */
  insertChar(char: string): void {
    const quill = this.quill;
    if (!quill) { return; }
    const range = quill.getSelection(true);
    if (range.length > 0) { quill.deleteText(range.index, range.length, 'user'); }
    quill.insertText(range.index, char, 'user');
    quill.setSelection(range.index + char.length, 0, 'user');
    this.charsPopover?.hide();
  }

  /** Refreshes which formats are active at the cursor (to show the check marks in the menu) */
  onFormatsMenuShow(): void {
    this.activeFormats = this.quill ? this.quill.getFormat() : {};
  }

  isActive(item: OtherFormat): boolean {
    const current = this.activeFormats[item.format];
    return item.value === true ? !!current : current === item.value;
  }

  /** Applies / removes a format of the "other formats" menu */
  toggleFormat(item: OtherFormat): void {
    const quill = this.quill;
    if (!quill) { return; }
    quill.getSelection(true);
    quill.format(item.format, this.isActive(item) ? false : item.value, 'user');
    this.formatsPopover?.hide();
    quill.focus();
  }

  private notifyChange(): void {
    this.host.nativeElement.dispatchEvent(new Event('change', { bubbles: true }));
  }
}
