import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './header/header.component';
import { SideMenuComponent } from './side-menu/side-menu.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { RouterModule } from '@angular/router';
import { ButtonModule } from "primeng/button";
import { SidebarModule } from "primeng/sidebar";
import { FooterComponent } from './footer/footer.component';

@NgModule({
  declarations: [FooterComponent, HeaderComponent, SideMenuComponent],
  exports: [FooterComponent, HeaderComponent, SideMenuComponent],
  imports: [
    ButtonModule,
    CommonModule,
    FontAwesomeModule,
    RouterModule,
    SidebarModule,
  ]
})
export class PageControllersModule { }
