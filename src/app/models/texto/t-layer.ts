import { TTagset } from "./t-tagset";

/**Class describing an annotation layer */
export class TLayer extends TTagset {
  /**Color used for highlighting the annotation */
  color: string | undefined;
  overlapping: boolean | undefined;
}
