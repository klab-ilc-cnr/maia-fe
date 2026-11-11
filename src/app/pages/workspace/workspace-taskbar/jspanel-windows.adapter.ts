import { NgZone } from '@angular/core';
import { TaskbarWindow, TaskbarWindowState, TaskbarWindowType, TaskbarWindowsSource } from './taskbar-window.model';

declare const jsPanel: any;

/** Eventi di jsPanel (sul document) che cambiano l'elenco, lo stato o la finestra in primo piano. */
const JSPANEL_EVENTS = ['jspanelloaded', 'jspanelclosed', 'jspanelstatuschange', 'jspanelfronted'];

/** Tipo di finestra dall'id con cui il workspace la crea (prefissi in `workspace.component.ts`). */
export function windowTypeFromId(id: string): TaskbarWindowType {
  if (id === 'corpusExplorerTile') { return 'corpus'; }
  if (id === 'lexiconTile') { return 'lexicon'; }
  if (id === 'searchTile') { return 'search'; }
  if (id === 'dictionaryTile') { return 'dictionary'; }
  if (id === 'ontologyExplorerTile') { return 'ontology'; }
  if (id.startsWith('textTile_')) { return 'text'; }
  if (id.startsWith('lexiconEditTile_')) { return 'lexiconEdit'; }
  if (id.startsWith('dictionaryEditTile_')) { return 'dictionaryEdit'; }
  if (id.startsWith('ontologyViewTile_')) { return 'ontologyView'; }
  return 'other';
}

/**
 * Adattatore tra la barra delle finestre e jsPanel (abbandonato, da sostituire): quando cambierà la libreria
 * basta riscrivere questa classe.
 */
export class JsPanelWindowsAdapter implements TaskbarWindowsSource {
  constructor(private readonly zone: NgZone) { }

  watch(onChange: (windows: TaskbarWindow[]) => void): () => void {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let last = '';
    let disposed = false;
    const refresh = () => {
      timer = undefined;
      if (disposed) { return; }
      const windows = this.read();
      const signature = JSON.stringify(windows);
      if (signature === last) { return; }
      last = signature;
      this.zone.run(() => onChange(windows));
    };
    // più eventi di seguito (es. ripristino: normalizzazione + primo piano) producono un solo aggiornamento
    const schedule = () => { if (timer === undefined) { timer = setTimeout(refresh, 0); } };
    this.zone.runOutsideAngular(() => JSPANEL_EVENTS.forEach(name => document.addEventListener(name, schedule)));
    schedule();
    return () => {
      disposed = true;
      if (timer !== undefined) { clearTimeout(timer); }
      JSPANEL_EVENTS.forEach(name => document.removeEventListener(name, schedule));
    };
  }

  toggle(id: string): void {
    const panel = this.panel(id);
    if (!panel) { return; }
    if (panel.status === 'minimized') {
      panel.front(); // ripristina (anche ingrandita se lo era) e porta davanti
    } else if (this.activeId() === id) {
      panel.minimize();
    } else {
      panel.front();
    }
  }

  minimize(id: string): void { this.panel(id)?.minimize(); }

  maximize(id: string): void {
    const panel = this.panel(id);
    if (!panel) { return; }
    panel.maximize();
    panel.front();
  }

  close(id: string): void { this.panel(id)?.close(null, true); }

  private panel(id: string): any {
    const el: any = document.getElementById(id);
    return el && el.classList?.contains('jsPanel-standard') ? el : null;
  }

  /** Finestra in primo piano: quella non minimizzata con lo z-index più alto. */
  private activeId(): string | null {
    const open = (jsPanel.getPanels() as any[]).filter(p => p.status !== 'minimized'); // già ordinate per z-index
    return open.length ? open[0].id : null;
  }

  /** Finestre in ordine di apertura (ordine nel DOM, che il porta-davanti non cambia). */
  private read(): TaskbarWindow[] {
    const activeId = this.activeId();
    return (Array.from(document.querySelectorAll('.jsPanel-standard')) as any[]).map(p => ({
      id: p.id,
      title: (p.headertitle?.textContent ?? p.options?.headerTitle ?? p.id).trim(),
      type: windowTypeFromId(p.id),
      state: (p.status === 'minimized' ? 'minimized' : p.status === 'maximized' || p.status === 'smallifiedmax' ? 'maximized' : 'normal') as TaskbarWindowState,
      active: p.id === activeId
    }));
  }
}
