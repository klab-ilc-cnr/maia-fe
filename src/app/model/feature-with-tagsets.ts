import { Feature } from './feature';
import { Tagset } from './tagset';

export class FeatureWithTagsets extends Feature {
  tagset: Tagset | undefined
}
