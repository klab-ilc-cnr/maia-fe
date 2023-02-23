/*
  © Copyright 2021-2022  Istituto di Linguistica Computazionale "A. Zampolli", Consiglio Nazionale delle Ricerche, Pisa, Italy.
 
This file is part of EpiLexo.

EpiLexo is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

EpiLexo is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with EpiLexo. If not, see <https://www.gnu.org/licenses/>.
*/

/**Interfaccia che rappresenta i filtri della richiesta di un'entrata lessicale */
export interface LexicalEntryRequest {
    /**Testo da cercare */
    text: string,
    /**Modalità di ricerca */
    searchMode: searchModeEnum,
    /**Tipo */
    type: string,
    /**POS */
    pos: string,
    /**Tipo di forma (entrata o forma flessa) */
    formType: formTypeEnum | string,
    /**Autore dell'entrata */
    author: string,
    /**Lingua dell'entrata */
    lang: string,
    /**Stato di lavorazione */
    status: string,
    /**offset */
    offset: number,
    /**Limite dei risultati */
    limit: number
  }
  
  /**Enum delle tipologie di ricerca disponibili */
  export enum searchModeEnum {
    equals = "equals",
    startsWith = "startsWith",
    contains = "contains",
    endsWith = "endsWith"
  }
  
  /**Enum delle tipologie di forme disponibili */
  export enum formTypeEnum {
    flexed = "flexed",
    entry = "entry"
  }