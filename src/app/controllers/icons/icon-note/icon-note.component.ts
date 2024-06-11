import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { faCommentDots } from '@fortawesome/free-regular-svg-icons';
import { IconBaseComponent } from '../icon-base/icon-base.component';

@Component({
  selector: 'app-icon-note',
  templateUrl: '../icon-base/icon-base.component.html',
  styleUrls: ['../icon-base/icon-base.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IconNoteComponent extends IconBaseComponent implements OnInit {

  override ngOnInit(): void {
    this.icon = faCommentDots;
  }

}
