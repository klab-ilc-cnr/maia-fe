import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ButtonModule } from "primeng/button";
import { SidebarModule } from "primeng/sidebar";
import { TooltipModule } from 'primeng/tooltip';
import { IconsModule } from '../icons/icons.module';
import { FooterComponent } from './footer/footer.component';
import { HeaderComponent } from './header/header.component';
import { LoaderComponent } from './loader/loader.component';
import { SideMenuComponent } from './side-menu/side-menu.component';

@NgModule({
  declarations: [FooterComponent, HeaderComponent, SideMenuComponent, LoaderComponent],
  exports: [FooterComponent, HeaderComponent, SideMenuComponent, LoaderComponent],
  imports: [
    ButtonModule,
    CommonModule,
    FontAwesomeModule,
    RouterModule,
    SidebarModule,
    IconsModule,
    TooltipModule,
  ]
})
export class PageControllersModule { }
