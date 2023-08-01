import { AnnotationCore } from "./annotation-core";
import { TAnnotation } from "./t-annotation";
import { TFeature } from "./t-feature";

export class TAnnotationFeature extends AnnotationCore {
  annotation: TAnnotation | undefined;
  feature: TFeature | undefined;
  value: string | undefined;
}
