import { AnnotationCore } from "./annotation-core";

/**Class describing a tagset */
export class TTagset extends AnnotationCore {
  /**Name of the tagset */
  name: string | undefined;
  /**Description of the tagset */
  description: string | undefined;
}
