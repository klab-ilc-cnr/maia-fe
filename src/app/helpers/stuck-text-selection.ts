import { NgZone } from '@angular/core';

/**
 * PrimeNG's p-dialog turns text selection off in the whole page (`user-select: none` and the attribute
 * `data-p-unselectable-text` on the body) while a dialog is being dragged or resized, and turns it on again at the mouse release.
 * If the dialog goes away before the release, the page stays like that: no text can be selected anywhere (in the text window
 * neither double click nor click and drag) until the page is reloaded.
 * @returns {boolean} true if the page was in that state and has been restored
 */
export function releaseStuckTextSelection(): boolean {
  const body = document.body;
  if (body.style.userSelect !== 'none' && !body.hasAttribute('data-p-unselectable-text')) { return false; }
  body.style.userSelect = '';
  body.removeAttribute('data-p-unselectable-text');
  return true;
}

/**
 * Every mouse release ends any drag or resize, so it is the moment to restore the page if it was left without text selection.
 * It runs after the handlers of the dialogs (which restore it themselves in the normal case) and outside Angular (no change
 * detection for every mouse release).
 * @param zone {NgZone} Angular zone
 * @returns {() => void} function that removes the listener
 */
export function guardAgainstStuckTextSelection(zone: NgZone): () => void {
  const onMouseUp = () => setTimeout(() => {
    if (releaseStuckTextSelection()) {
      console.warn('Text selection was left disabled (a dialog was closed while being dragged or resized): restored');
    }
  }, 0);
  zone.runOutsideAngular(() => window.addEventListener('mouseup', onMouseUp, true));
  return () => window.removeEventListener('mouseup', onMouseUp, true);
}
