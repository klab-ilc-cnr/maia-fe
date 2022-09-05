import { ElementType } from './element-type';
import { DocumentMetadata } from "./document-metadata"

export class DocumentElement {
  path: string | undefined
  name: string | undefined
  type!: ElementType
  'element-id': number
  metadata: DocumentMetadata | undefined
  children: DocumentElement[] | undefined
}
