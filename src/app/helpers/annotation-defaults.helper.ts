import { FormGroup } from '@angular/forms';
import { Observable, take, takeUntil } from 'rxjs';
import { TFeature } from '../models/texto/t-feature';
import { TTagset } from '../models/texto/t-tagset';
import { TTagsetItem } from '../models/texto/t-tagset-item';

/**
 * Default value of the tagset features when a NEW annotation is created: it is the `defaultItem` of the tagset, set in the
 * tagset manager (the backend sends it with the tagset of each feature of the layer, as `{id}`).
 * @param tagset {TTagset|undefined} tagset of the feature
 * @param items {TTagsetItem[]} items of the tagset
 * @returns {string|undefined} name of the item to preselect (as written in the tagset) or undefined if there is no default
 * or it is not one of the items
 */
export function defaultTagsetValue(tagset: TTagset | undefined, items: TTagsetItem[]): string | undefined {
  const defaultItem = tagset?.defaultItem;
  if (!defaultItem) { return undefined; }
  const found = defaultItem.id !== undefined && defaultItem.id !== null
    ? items.find(item => item.id === defaultItem.id)
    : items.find(item => item.name === defaultItem.name);
  return found?.name;
}

/**
 * Preselects the default value in the tagset fields of an annotation form (only the empty ones: a value chosen by the
 * user while the items were loading is kept). Tagsets without a default cause no request.
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
    const tagset = f.feature?.tagset;
    if (!name || !tagset?.defaultItem || !f.tagsetItems) { return; }
    f.tagsetItems.pipe(take(1), takeUntil(destroy$)).subscribe(items => {
      const value = defaultTagsetValue(tagset, items);
      const control = featureForm.get(name);
      if (value && control && !control.value) {
        control.setValue(value);
      }
    });
  });
}
