import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { faRobot, faUser } from '@fortawesome/free-solid-svg-icons';
import { IconBaseComponent } from '../icon-base/icon-base.component';

@Component({
  selector: 'app-icon-author',
  templateUrl: './icon-author.component.html',
  styleUrls: ['../icon-base/icon-base.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IconAuthorComponent extends IconBaseComponent implements OnInit {
  @Input() tooltip! : string;
  @Input() isBot!: boolean;

  override ngOnInit(): void {
    this.icon = this.isBot ? faRobot : faUser;
  }

}
