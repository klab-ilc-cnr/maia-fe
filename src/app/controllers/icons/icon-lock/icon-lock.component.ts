import { Component, Input, OnInit } from '@angular/core';
import { faLock, faUnlock } from '@fortawesome/free-solid-svg-icons';
import { IconBaseComponent } from '../icon-base/icon-base.component';

@Component({
  selector: 'app-icon-lock',
  templateUrl: './icon-lock.component.html',
  styleUrls: ['./icon-lock.component.scss']
})
export class IconLockComponent extends IconBaseComponent implements OnInit {

  isLocked! : boolean;
  @Input() status! : string;

  override ngOnInit(): void {
    this.isLocked = this.status === 'reviewed';
    this.icon = this.isLocked ? faLock : faUnlock;
  }

}
