import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { faHouseDamage } from '@fortawesome/free-solid-svg-icons';

/**Componente del menu del workspace */
@Component({
  selector: 'app-workspace-menu',
  templateUrl: './workspace-menu.component.html',
  styleUrls: ['./workspace-menu.component.scss']
})
export class WorkspaceMenuComponent {
  /**Input della lista degli elementi del menu */
  @Input() itemsInput: MenuItem[] = [];
  @Input() workspaceName!: string;
  /**Evento emesso al click su una voce di menu */
  @Output() menuClickEvent = new EventEmitter<string>();

  /**Icona fortawesome per uscire dal workspace */
  faHouseDamage = faHouseDamage;

  /**
   * Metodo che emette l'evento di click su una voce di menu
   * @param event {any} stringa emessa al click su una voce di menu
   */
  menuClick(event: any) {

    // let node;
    // if (event.target.tagName === "A") {
    //   node = event.target;
    // } else {
    //   node = event.target.parentNode;
    // }
    // let menuitem = document.getElementsByClassName("ui-menuitem-link");
    // for (let i = 0; i < menuitem.length; i++) {
    //   menuitem[i].classList.remove("active");
    // }
    // node.classList.add("active")
    this.menuClickEvent.emit(event)
  }

}
