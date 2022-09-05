import { Tagset } from '../tagset/tagset';
import { Feature } from './feature';

export class FeatureWithTagsets extends Feature {
  tagset: Tagset | undefined
}
