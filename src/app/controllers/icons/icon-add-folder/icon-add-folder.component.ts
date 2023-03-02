import { Component, OnInit } from '@angular/core';
import { faFolderPlus } from '@fortawesome/free-solid-svg-icons';
import { IconBaseComponent } from '../icon-base/icon-base.component';

/**
 * Classe dell'icona add-folder
 * @extends IconBaseComponent
 */
@Component({
  selector: 'app-icon-add-folder',
  templateUrl: '../icon-base/icon-base.component.html',
  styleUrls: ['../icon-base/icon-base.component.scss']
})
export class IconAddFolderComponent extends IconBaseComponent implements OnInit {
 /**Metodo dell'interfaccia OnInit, utilizzato per inizializzare l'icona visualizzata */
  override ngOnInit(): void {
    this.icon = faFolderPlus;
  }

}
