import { Component, OnInit } from '@angular/core';
import { faSync } from '@fortawesome/free-solid-svg-icons';
import { IconBaseComponent } from '../icon-base/icon-base.component';

/**
 * Classe dell'icona move
 * @extends IconBaseComponent
 */
@Component({
  selector: 'app-icon-move',
  templateUrl: '../icon-base/icon-base.component.html',
  styleUrls: ['../icon-base/icon-base.component.scss']
})
export class IconMoveComponent extends IconBaseComponent implements OnInit {

 /**Metodo dell'interfaccia OnInit, utilizzato per inizializzare l'icona visualizzata */
 override ngOnInit(): void {
    this.icon = faSync;
  }

}
