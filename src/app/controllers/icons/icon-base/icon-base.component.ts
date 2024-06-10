import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { IconDefinition, SizeProp } from '@fortawesome/fontawesome-svg-core';

/**Classe del componente di base per le icone */
@Component({
  selector: 'app-icon-base',
  templateUrl: './icon-base.component.html',
  styleUrls: ['./icon-base.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IconBaseComponent implements OnInit {
  /**Input per il componente base delle icone */
  @Input()
  /**Dimensioni dell'icon */
  size! : SizeProp
  /**Icona da visualizzare */
  icon! : IconDefinition

  /**Costruttore per IconBaseComponent */
  constructor() { }

  /**Metodo dell'interfaccia OnInit */
  ngOnInit(): void {
  }

}
