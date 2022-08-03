import { DocumentMetadata } from "./document-metadata"
import { DocumentType } from "./document-type"

export class DocumentElement {
  path: string | undefined
  name: string | undefined
  type!: DocumentType
  'element-id': number
  metadata: DocumentMetadata | undefined
  children: DocumentElement[] | undefined
}
