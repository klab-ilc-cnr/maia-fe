import { Component, OnInit } from '@angular/core';
import { faFileImport } from '@fortawesome/free-solid-svg-icons';
import { IconBaseComponent } from '../icon-base/icon-base.component';

@Component({
  selector: 'app-icon-upload-file',
  templateUrl: '../icon-base/icon-base.component.html',
  styleUrls: ['../icon-base/icon-base.component.scss']
})
export class IconUploadFileComponent extends IconBaseComponent implements OnInit {

  override ngOnInit(): void {
    this.icon = faFileImport;
  }

}
