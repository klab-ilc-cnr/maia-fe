import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-workspace-text-selector',
  templateUrl: './workspace-text-selector.component.html',
  styleUrls: ['./workspace-text-selector.component.scss']
})
export class WorkspaceTextSelectorComponent implements OnInit {

  @Input()textList : Array<any> = []

  constructor() { }

  ngOnInit(): void {
  }

}
