import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './header/header.component';
import { SideMenuComponent } from './side-menu/side-menu.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {RouterModule} from '@angular/router';

@NgModule({
  declarations: [HeaderComponent, SideMenuComponent],
  exports: [HeaderComponent, SideMenuComponent],
  imports: [
    CommonModule,
    FontAwesomeModule,
    RouterModule
  ]
})
export class PageControllersModule { }
