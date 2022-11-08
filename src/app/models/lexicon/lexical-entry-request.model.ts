/*
  © Copyright 2021-2022  Istituto di Linguistica Computazionale "A. Zampolli", Consiglio Nazionale delle Ricerche, Pisa, Italy.
 
This file is part of EpiLexo.

EpiLexo is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

EpiLexo is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with EpiLexo. If not, see <https://www.gnu.org/licenses/>.
*/
export interface LexicalEntryRequest {
    text: string,
    searchMode: searchModeEnum,
    type: string,
    pos: string,
    formType: formTypeEnum | string,
    author: string,
    lang: string,
    status: string,
    offset: number,
    limit: number
  }
  
  export enum searchModeEnum {
    equals = "equals",
    startsWith = "startsWith",
    contains = "contains",
    endsWith = "endsWith"
  }
  
  export enum formTypeEnum {
    flexed = "flexed",
    entry = "entry"
  }