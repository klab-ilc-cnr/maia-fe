import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-dropdown-plus-number',
  templateUrl: './dropdown-plus-number.component.html',
  styleUrls: ['./dropdown-plus-number.component.scss']
})
export class DropdownPlusNumberComponent implements OnInit {
  @Input() optionList!: Observable<any>;
  @Input() optionLabel!: string;
  @Input() optionValue!: string;
  @Input() dropdownFieldValue!: any;
  @Input() numberFieldValue!: number;
  @Output() remove = new EventEmitter();
  @Output() selected = new EventEmitter<any>();

  constructor() { }

  ngOnInit(): void {
  }

  onRemove() {
    this.remove.emit();
  }

  onChangeValue() {
    if(this.dropdownFieldValue !== '') {
      this.selected.emit({ documentId: this.dropdownFieldValue, frequency: this.numberFieldValue });
    }
  }
}
