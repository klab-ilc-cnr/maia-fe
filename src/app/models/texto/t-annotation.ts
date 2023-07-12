import { AnnotationCore } from "./annotation-core";
import { ResourceElement } from "./corpus-element";
import { TLayer } from "./t-layer";

export class TAnnotation extends AnnotationCore {
  layer: TLayer | undefined;
  resource: ResourceElement | undefined;
  start: number | undefined;
  end: number | undefined;
  user: { id: number; } | undefined; //TODO VERIFICARE RISPOSTA PERCHè IL TIPO USER DI SWAGGER è COMPLESSO
}
