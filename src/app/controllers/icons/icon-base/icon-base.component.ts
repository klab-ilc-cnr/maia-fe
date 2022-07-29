import { Component, Input, OnInit } from '@angular/core';
import { IconDefinition, SizeProp } from '@fortawesome/fontawesome-svg-core';

@Component({
  selector: 'app-icon-base',
  templateUrl: './icon-base.component.html',
  styleUrls: ['./icon-base.component.scss']
})
export class IconBaseComponent implements OnInit {
  @Input()
  size! : SizeProp
  icon! : IconDefinition

  constructor() { }

  ngOnInit(): void {
  }

}
