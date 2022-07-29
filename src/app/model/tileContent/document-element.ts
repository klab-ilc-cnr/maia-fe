import { DocumentMetadata } from "./document-metadata"

export class DocumentElement {
  path: string | undefined
  name: string | undefined
  type: string | undefined
  'element-id': number
  metadata: DocumentMetadata | undefined
  children: DocumentElement[] | undefined
}
