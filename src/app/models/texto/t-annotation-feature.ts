import { AnnotationCore } from "./annotation-core";
import { TAnnotation } from "./t-annotation";
import { TFeature } from "./t-feature";

/**Class describing a feature associated with an annotation with its assigned value, if any */
export class TAnnotationFeature extends AnnotationCore {
  /**A given annotation */
  annotation: TAnnotation | undefined;
  /**A feature of the current annotation layer */
  feature: TFeature | undefined;
  /**Value assigned to the feature in the annotation */
  value: string | undefined;
}
