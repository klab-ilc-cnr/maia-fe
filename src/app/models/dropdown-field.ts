/**Interfaccia che rappresenta una option di una dropdown */
export interface DropdownField {
  /**Nome della option */
  name: string,
  /**Identificativo della option */
  code: string
}

/**Interfaccia che rappresenta un bottone in una selectbutton */
export interface SelectButtonField {
  /**Icona associata al pulsante */
  icon: string,
  /**Justify */
  justify: string
}
