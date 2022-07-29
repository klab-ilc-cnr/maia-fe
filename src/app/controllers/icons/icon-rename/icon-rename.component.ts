import { Component, OnInit } from '@angular/core';
import { faPen } from '@fortawesome/free-solid-svg-icons';
import { IconBaseComponent } from '../icon-base/icon-base.component';

@Component({
  selector: 'app-icon-rename',
  templateUrl: '../icon-base/icon-base.component.html',
  styleUrls: ['../icon-base/icon-base.component.scss']
})
export class IconRenameComponent extends IconBaseComponent implements OnInit {

  override ngOnInit(): void {
    this.icon = faPen;
  }

}
