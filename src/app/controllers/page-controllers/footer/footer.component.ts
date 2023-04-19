import { Component, OnInit } from '@angular/core';

/**Componente del footer */
@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit {

  /**Costruttore per FooterComponent */
  constructor() { }

  /**Metodo dell'interfaccia OnInit */ //TODO valutare la rimozione per mancato utilizzo
  ngOnInit(): void {
  }

}
