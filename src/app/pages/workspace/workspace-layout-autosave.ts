import { NgZone } from '@angular/core';

/** Pause (ms) after the last change of the windows before the layout of the workspace is saved. */
export const LAYOUT_AUTOSAVE_PAUSE_MS = 10_000;

/** jsPanel events (on the document) that change the set of windows, their state, position or size. */
const LAYOUT_EVENTS = ['jspanelloaded', 'jspanelclosed', 'jspanelstatuschange', 'jspaneldragstop', 'jspanelresizestop'];

/**
 * Saves the layout of the workspace (open windows, positions, sizes, minimized) by itself, after a pause with no changes.
 *
 * The backend replaces all the tiles of the workspace at each save (delete + insert in one transaction, no concurrency control), so:
 * - it is not saved at every change (a drag or a resize fires dozens of events per second): a timer restarts at each event and
 *   the layout is saved once, when the user stops;
 * - nothing is sent if the layout is the same as the last one saved;
 * - two saves never overlap: if the user changes the layout while a save is running, one more save follows when it ends.
 * The save when leaving the workspace stays as it was: this is only the safety net for a closed tab or a crash.
 */
export class WorkspaceLayoutAutosave {
  private armed = false;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private inFlight = false;
  private pending = false;
  private lastSaved = '';
  private readonly onEvent = () => this.schedule();

  /**
   * @param zone {NgZone} Angular zone (events and timer run outside it)
   * @param getSignature {() => string} serialization of the layout that changes only when something worth saving changes
   * @param save {(done: (ok: boolean) => void) => void} starts a save and calls `done` when it ends
   * @param canSave {() => boolean} false when it makes no sense to try (session over)
   * @param pauseMs {number} pause without changes before saving
   */
  constructor(
    private readonly zone: NgZone,
    private readonly getSignature: () => string,
    private readonly save: (done: (ok: boolean) => void) => void,
    private readonly canSave: () => boolean,
    private readonly pauseMs = LAYOUT_AUTOSAVE_PAUSE_MS,
  ) { }

  /** Starts watching, taking the current layout as the one already saved (call it once the saved windows are restored). */
  arm(): void {
    if (this.armed) { return; }
    this.armed = true;
    this.lastSaved = this.getSignature();
    this.zone.runOutsideAngular(() => LAYOUT_EVENTS.forEach(name => document.addEventListener(name, this.onEvent)));
  }

  /** Stops watching and drops the timer (when leaving the workspace the windows are closed: those events must not save). */
  disarm(): void {
    this.armed = false;
    this.pending = false;
    if (this.timer !== undefined) { clearTimeout(this.timer); this.timer = undefined; }
    LAYOUT_EVENTS.forEach(name => document.removeEventListener(name, this.onEvent));
  }

  /** Tells that the layout has just been saved by someone else (e.g. the save when leaving), so it is not sent again. */
  markSaved(): void {
    if (this.armed) { this.lastSaved = this.getSignature(); }
  }

  private schedule(): void {
    if (!this.armed) { return; }
    if (this.timer !== undefined) { clearTimeout(this.timer); }
    this.timer = setTimeout(() => this.run(), this.pauseMs);
  }

  private run(): void {
    this.timer = undefined;
    if (!this.armed || !this.canSave()) { return; }
    if (this.inFlight) { this.pending = true; return; }
    const signature = this.getSignature();
    if (signature === this.lastSaved) { return; }
    this.inFlight = true;
    this.zone.run(() => this.save(ok => {
      this.inFlight = false;
      if (ok) { this.lastSaved = signature; }
      if (this.pending && this.armed) { this.pending = false; this.schedule(); }
    }));
  }
}
