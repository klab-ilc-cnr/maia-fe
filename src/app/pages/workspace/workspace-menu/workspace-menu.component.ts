import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { faHouseDamage } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-workspace-menu',
  templateUrl: './workspace-menu.component.html',
  styleUrls: ['./workspace-menu.component.scss']
})
export class WorkspaceMenuComponent implements OnInit {
  @Input() itemsInput: MenuItem[] = [];
  @Output() menuClickEvent = new EventEmitter<string>();

  faHouseDamage = faHouseDamage;

  constructor() { }

  ngOnInit() {
  }

  menuClick(event: any) {

/*     let node;
    if (event.target.tagName === "A") {
      node = event.target;
    } else {
      node = event.target.parentNode;
    }
    let menuitem = document.getElementsByClassName("ui-menuitem-link");
    for (let i = 0; i < menuitem.length; i++) {
      menuitem[i].classList.remove("active");
    }
    node.classList.add("active") */
    this.menuClickEvent.emit(event)
    }

}
