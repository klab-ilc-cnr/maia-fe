import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { TextChoice } from 'src/app/models/tile/text-choice-element.model';

//TODO il componente viene richiamato solamente in un metodo a sua volta non utilizzato
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
