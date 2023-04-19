/**Classe che rappresenta un valore di un tagset */
export class TagsetValue {
  /**Identificativo numerico del lavoro */
  id: number | undefined
  /**Nome del valore */
	name: string | undefined
  /**Nome originale */ //TODO cercare dettagli su cosa rappresenta
  originalName?: string | undefined
  /**Descrizione */
  description: string  | undefined
}
