import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { TextChoice } from 'src/app/model/text-choice-element.model';

@Component({
  selector: 'app-workspace-text-selector',
  templateUrl: './workspace-text-selector.component.html',
  styleUrls: ['./workspace-text-selector.component.scss']
})
export class WorkspaceTextSelectorComponent implements OnInit {

  @Input() textChoiceList: Array<TextChoice> = []
  @Output() onTextSelectEvent = new EventEmitter<any>();

  selectedText : any;

  constructor() { }

  ngOnInit(): void {
  }

  onClick(event: any) {
    if(event.srcElement.tagName === 'TD')
    {
      this.onTextSelectEvent.emit(event)
    }
  }
}
