import { _ElementType } from './element-type';
import { DocumentMetadata } from "./document-metadata"

/**Classe che rappresenta un elemento del sistema documentale */
export class DocumentElement {
  /**Path dell'elemento */
  path: string | undefined
  /**Nome dell'elemento */
  name: string | undefined
  /**Tipo di elemento (cartella o file) */
  type!: _ElementType
  /**Identificativo numerico dell'elemento */
  'element-id': number
  /**Metadati dell'elemento */
  metadata: DocumentMetadata | undefined
  /**Lista degli elementi figli dell'elemento corrente */
  children: DocumentElement[] | undefined
}
