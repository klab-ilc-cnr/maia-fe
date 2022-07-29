import { Component, OnInit } from '@angular/core';
import { faFolderPlus } from '@fortawesome/free-solid-svg-icons';
import { IconBaseComponent } from '../icon-base/icon-base.component';

@Component({
  selector: 'app-icon-add-folder',
  templateUrl: '../icon-base/icon-base.component.html',
  styleUrls: ['../icon-base/icon-base.component.scss']
})
export class IconAddFolderComponent extends IconBaseComponent implements OnInit {

  override ngOnInit(): void {
    this.icon = faFolderPlus;
  }

}
