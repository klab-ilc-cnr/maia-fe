import { Component, OnInit } from '@angular/core';
import { SidebarModule } from '@coreui/angular';
import { navItems } from '../_nav';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css']
})
export class LayoutComponent implements OnInit {
  public sidebarMinimized = false;

  public navItems = navItems;

  toggleMinimize(e: boolean) {
    this.sidebarMinimized = e;
  }

  constructor() { }

  ngOnInit(): void {
  }

}
