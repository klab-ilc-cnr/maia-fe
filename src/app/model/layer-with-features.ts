import { FeatureWithTagsets } from './feature-with-tagsets';
import { Layer } from './layer.model';

export class LayerWithFeatures extends Layer{
  features: Array<FeatureWithTagsets> | undefined
}
