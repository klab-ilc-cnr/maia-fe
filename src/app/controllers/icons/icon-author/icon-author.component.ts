import { ChangeDetectionStrategy, Component, Input, OnInit, TemplateRef, ViewChild, ViewContainerRef } from '@angular/core';
import { faRobot, faUser } from '@fortawesome/free-solid-svg-icons';
import { IconBaseComponent } from '../icon-base/icon-base.component';
import { Tooltip } from 'primeng/tooltip';

@Component({
  selector: 'app-icon-author',
  templateUrl: './icon-author.component.html',
  styleUrls: ['../icon-base/icon-base.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IconAuthorComponent extends IconBaseComponent implements OnInit {
  @Input() tooltip!: string | TemplateRef<HTMLElement> | undefined;
  @Input() isBot!: boolean;

  public text: string = '';
  private tooltipText!: HTMLDivElement;

  constructor(private viewContainer: ViewContainerRef
  ) {
    super();
  }

  override ngOnInit(): void {
    this.icon = this.isBot ? faRobot : faUser;
  }

  ngOnChanges(): void {
    this.extendsPrimeng14TooltipToNgTemplate();
  }

  /**This function extends the primeng tooltip functionality,
   * allowing to pass templates to it, as it works in newer version 17,
   * warning: the escape parameter functionality is ignored
   */
  private extendsPrimeng14TooltipToNgTemplate() {
    this.tooltipText = document.createElement('div');
    const content = this.tooltip;
    if (content instanceof TemplateRef) {
      const embeddedViewRef = this.viewContainer.createEmbeddedView(content);
      embeddedViewRef.detectChanges();
      embeddedViewRef.rootNodes.forEach((node) => this.tooltipText.appendChild(node));
    }
    else {
      this.tooltipText.innerHTML = content ?? '';
    }

    this.text = this.tooltipText.innerHTML;
  }
}
