import { AnnotationCore } from "./annotation-core";

/**Class describing a tagset */
export class TTagset extends AnnotationCore {
  /**Name of the tagset */
  name: string | undefined;
  /**Description of the tagset */
  description: string | undefined;
  /**
   * Value preselected in new annotations (the backend answers with `{id}` only, or null).
   * An update of the tagset that does not send it removes it: always send back the current one.
   */
  defaultItem?: { id?: number; name?: string } | null;
}
