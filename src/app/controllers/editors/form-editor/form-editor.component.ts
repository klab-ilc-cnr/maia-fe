import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-form-editor',
  templateUrl: './form-editor.component.html',
  styleUrls: ['./form-editor.component.scss']
})
export class FormEditorComponent implements OnInit {
  @Input() instanceName!: string;
  
  constructor() { }

  ngOnInit(): void {
  }

}
