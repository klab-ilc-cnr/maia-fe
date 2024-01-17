import { AnnotationCore } from "./annotation-core";
import { ResourceElement } from "./corpus-element";
import { TAnnotationFeature } from "./t-annotation-feature";
import { TLayer } from "./t-layer";

/**Class describing a text annotation */
export class TAnnotation extends AnnotationCore {
  /**Annotation layer to which it belongs */
  layer: TLayer | undefined;
  /**Corpus document on which the annotation is placed */
  resource: ResourceElement | undefined;
  /**Index of the initial character of the annotated string */
  start: number | undefined;
  /**Index of the final character of the annotated string */
  end: number | undefined;
  /**Annotation creator identifier */
  user: { id: number; } | undefined; //TODO VERIFICARE RISPOSTA PERCHè IL TIPO USER DI SWAGGER è COMPLESSO
  /**List of features possibly enhanced for an annotation */
  features: TAnnotationFeature[] | undefined;
}
