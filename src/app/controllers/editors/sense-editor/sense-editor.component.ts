import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-sense-editor',
  templateUrl: './sense-editor.component.html',
  styleUrls: ['./sense-editor.component.scss']
})
export class SenseEditorComponent implements OnInit {
  @Input() instanceName!: string;

  constructor() { }

  ngOnInit(): void {
  }

}
