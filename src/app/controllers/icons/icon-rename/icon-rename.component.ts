import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { faPen } from '@fortawesome/free-solid-svg-icons';
import { IconBaseComponent } from '../icon-base/icon-base.component';

/**
 * Classe dell'icona rename
 * @extends IconBaseComponent
 */
@Component({
  selector: 'app-icon-rename',
  templateUrl: '../icon-base/icon-base.component.html',
  styleUrls: ['../icon-base/icon-base.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IconRenameComponent extends IconBaseComponent implements OnInit {
 /**Metodo dell'interfaccia OnInit, utilizzato per inizializzare l'icona visualizzata */
 override ngOnInit(): void {
    this.icon = faPen;
  }

}
