import { FormGroup } from '@angular/forms';
import { Observable, take, takeUntil } from 'rxjs';
import { TFeature } from '../models/texto/t-feature';
import { TTagsetItem } from '../models/texto/t-tagset-item';

/**
 * Default value of the tagset features when a NEW annotation is created.
 *
 * Interim solution: the defaults are listed here, by tagset name, until the backend can store a "default" flag on the
 * tagset items (then the editors will read it from the items and this list will go away).
 * - `tagset`: name of the tagset (case and surrounding spaces are ignored)
 * - `value`: name of the tagset item to preselect; if the tagset has no such item nothing is preselected
 */
export const TAGSET_DEFAULT_VALUES: ReadonlyArray<{ tagset: string; value: string }> = [
  { tagset: 'Tipo lessicale', value: 'Parola monorematica' },
];

const normalize = (text: string | undefined | null): string => (text ?? '').trim().toLowerCase();

/**
 * Name of the item to preselect for a tagset, if a default is configured and the item exists in the tagset.
 * @param tagsetName {string|undefined} name of the tagset of the feature
 * @param items {TTagsetItem[]} items of the tagset
 * @returns {string|undefined} item name (as written in the tagset) or undefined
 */
export function defaultTagsetValue(tagsetName: string | undefined, items: TTagsetItem[]): string | undefined {
  const config = TAGSET_DEFAULT_VALUES.find(d => normalize(d.tagset) === normalize(tagsetName));
  if (!config) { return undefined; }
  return items.find(item => normalize(item.name) === normalize(config.value))?.name;
}

/**
 * Preselects the default value in the tagset fields of an annotation form (only the empty ones: a value chosen by the
 * user while the items were loading is kept).
 * @param features {Array} features of the layer with the observable of the items of their tagset
 * @param featureForm {FormGroup} form with one control per feature name
 * @param destroy$ {Observable<unknown>} stops the pending requests when the editor is destroyed
 */
export function applyDefaultTagsetValues(
  features: Array<{ feature?: TFeature; tagsetItems?: Observable<TTagsetItem[]> }>,
  featureForm: FormGroup,
  destroy$: Observable<unknown>,
): void {
  features.forEach(f => {
    const name = f.feature?.name;
    const tagsetName = f.feature?.tagset?.name;
    if (!name || !tagsetName || !f.tagsetItems) { return; }
    if (!TAGSET_DEFAULT_VALUES.some(d => normalize(d.tagset) === normalize(tagsetName))) { return; }
    f.tagsetItems.pipe(take(1), takeUntil(destroy$)).subscribe(items => {
      const value = defaultTagsetValue(tagsetName, items);
      const control = featureForm.get(name);
      if (value && control && !control.value) {
        control.setValue(value);
      }
    });
  });
}
