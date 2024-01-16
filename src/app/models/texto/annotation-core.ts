import { TStatus } from "./t-status";

/**Class describing the core features of any annotation element */
export class AnnotationCore {
  /**Numeric identifier */
  id: number | undefined;
  /**Annotation status (e.g. REMOVED) */
  status: TStatus | undefined;
  /**Timestamp of the last edit */
  time: string | undefined;
}
