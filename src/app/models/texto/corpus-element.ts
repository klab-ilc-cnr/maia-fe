import { ElementType } from "../corpus/element-type";

/**Class describing the core features of any element of the Corpus */
export class CorpusElement {
  /**Numeric identifier */
  id!: number;
  /**Corpus element type */
  type!: ElementType;
  /**Parent element identifier */
  parent: { id: number; } | undefined;
  /**Name of the element */
  name: string | undefined;
  /**Description */
  description: string | undefined;
  /**Creator numeric identifier */
  user: { id: number; } | undefined;
}

/**Class describing a corpus element of resource type, i.e., a file or document */
export class ResourceElement extends CorpusElement {
  override type: ElementType = ElementType.RESOURCE;
}

/**Class describing a corpus element of folder type */
export class FolderElement extends CorpusElement {
  override type: ElementType = ElementType.FOLDER;
  /**List of corpus elements contained in the folder */
  children!: CorpusElement[];
}
