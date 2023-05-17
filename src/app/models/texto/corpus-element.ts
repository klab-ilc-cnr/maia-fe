import { ElementType } from "../corpus/element-type";

export class CorpusElement {
  id!: number;
  type!: ElementType;
  parent: { id: number; } | undefined;
  name: string | undefined;
  description: string | undefined;
  user: { id: number; } | undefined;
}

export class ResourceElement extends CorpusElement {
  override type: ElementType = ElementType.RESOURCE;
}

export class FolderElement extends CorpusElement {
  override type: ElementType = ElementType.FOLDER;
  children!: CorpusElement[];
}
