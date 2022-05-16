import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
//import * as jsPanel from 'jspanel4';
//import { jsPanel } from 'jspanel4/es6module/jspanel.js';
//import 'jspanel4/es6module/extensions/tooltip/jspanel.tooltip.js';

@Component({
  selector: 'app-workspace',
  templateUrl: './workspace.component.html',
  styleUrls: ['./workspace.component.scss']
})
export class WorkspaceComponent implements OnInit {

  constructor() { }

    ngOnInit(): void {
      jsPanel.create();
    }
}
