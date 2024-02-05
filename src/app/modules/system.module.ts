import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SystemInformationComponent } from '../pages/system-information/system-information.component';
import { SharedModule } from './shared.module';



@NgModule({
  declarations: [
    SystemInformationComponent
  ],
  imports: [
    SharedModule,
    RouterModule.forChild([
      {
        path: '',
        component: SystemInformationComponent
      }
    ]),
  ]
})
export class SystemModule { }
