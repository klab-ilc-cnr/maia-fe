import { NgZone } from '@angular/core';

/**
 * jsPanel remembers the last key pressed (`jsPanel.modifier`, set on keydown and cleared on keyup) and uses its Ctrl/Alt/Shift flags
 * when a window is resized: Ctrl or Alt lock the aspect ratio, so dragging the right edge changes the height too.
 * If the keyup never reaches the page (Alt+Tab, Ctrl+Tab, Ctrl+W, a key released in the developer tools or in another window…)
 * the flag stays set and every later resize behaves as if the key were held, until some key is pressed and released again.
 *
 * Every pointer press carries the real state of the modifier keys, so before jsPanel's own handlers (capture phase, on the
 * document) the remembered key is replaced with it: Ctrl/Alt/Shift held on purpose still work, a stale one does not.
 * @param zone {NgZone} Angular zone
 * @returns {() => void} function that removes the listeners
 */
export function guardAgainstStuckJsPanelModifier(zone: NgZone): () => void {
  const onPointerDown = (e: PointerEvent | MouseEvent) => {
    if (typeof jsPanel === 'undefined') { return; }
    jsPanel.modifier = (e.ctrlKey || e.altKey || e.shiftKey) ? e : false;
  };
  const onBlur = () => { if (typeof jsPanel !== 'undefined') { jsPanel.modifier = false; } };
  zone.runOutsideAngular(() => {
    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('mousedown', onPointerDown, true);
    window.addEventListener('blur', onBlur);
  });
  return () => {
    document.removeEventListener('pointerdown', onPointerDown, true);
    document.removeEventListener('mousedown', onPointerDown, true);
    window.removeEventListener('blur', onBlur);
  };
}
