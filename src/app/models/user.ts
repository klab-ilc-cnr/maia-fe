import { Language } from "./language";

/**Classe che definisce un utente */
export class User {
  /**Identificativo */
  id: string | undefined;
  /**Nome utente */
  username: string | undefined;
  /**Nome dell'utente */
  name: string | undefined;
  /**Cognome dell'utente */
  surname: string | undefined;
  /**Email dell'utente (utilizzata anche per il login) */
  email: string | undefined;
  created: string | undefined;
  updated: string | undefined;
  /**Ruolo */
  role: string | undefined;
  /**Definisce se l'utente è abilitato */
  active: boolean | undefined;
  /**Lista delle lingue associate all'utente */
  languages: Language[] | undefined;
}

export class TextoUser {
  email: string | undefined;
  enabled: boolean | undefined;
  id!: number;
  name: string | undefined;
  role: { id: number } | undefined;
  username: string | undefined;
}
