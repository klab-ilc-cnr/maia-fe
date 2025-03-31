import { ChangeDetectionStrategy, Component, Input, OnInit, TemplateRef, ViewContainerRef } from '@angular/core';
import { faCommentDots } from '@fortawesome/free-regular-svg-icons';
import { IconBaseComponent } from '../icon-base/icon-base.component';

@Component({
  selector: 'app-icon-note',
  templateUrl: '../icon-base/icon-base-tooltip.component.html',
  styleUrls: ['../icon-base/icon-base.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IconNoteComponent extends IconBaseComponent implements OnInit {
  @Input() tooltip!: string | TemplateRef<HTMLElement> | undefined;

  public text: string = '';
  private tooltipText!: HTMLDivElement;

  constructor(private viewContainer: ViewContainerRef
  ) {
    super();
  }

  override ngOnInit(): void {
    this.icon = faCommentDots;
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
