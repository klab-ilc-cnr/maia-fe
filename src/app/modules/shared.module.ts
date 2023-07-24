import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { CheckboxModule } from 'primeng/checkbox';
import { ColorPickerModule } from 'primeng/colorpicker';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ContextMenuModule } from 'primeng/contextmenu';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { EditorModule } from 'primeng/editor';
import { FieldsetModule } from 'primeng/fieldset';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputSwitchModule } from 'primeng/inputswitch';
import { ListboxModule } from 'primeng/listbox';
import { MenuModule } from 'primeng/menu';
import { MenubarModule } from 'primeng/menubar';
import { MultiSelectModule } from 'primeng/multiselect';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { PaginatorModule } from 'primeng/paginator';
import { PanelModule } from 'primeng/panel';
import { RadioButtonModule } from 'primeng/radiobutton';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SkeletonModule } from 'primeng/skeleton';
import { SplitterModule } from 'primeng/splitter';
import { TableModule } from 'primeng/table';
import { TabViewModule } from 'primeng/tabview';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';
import { TreeModule } from 'primeng/tree';
import { TreeSelectModule } from 'primeng/treeselect';
import { TreeTableModule } from 'primeng/treetable';
import { PopupDeleteItemComponent } from '../controllers/popup/popup-delete-item/popup-delete-item.component';
import { AutocompleteCheckboxComponent } from '../forms/autocomplete-checkbox/autocomplete-checkbox.component';
import { DoubleAutocompleteComponent } from '../forms/double-autocomplete/double-autocomplete.component';
import { ShouldBeEditablePipe } from '../pipes/should-be-editable.pipe';
import { NotDuplicateNameDirective } from '../validators/not-duplicate-name.directive';
import { TagsetValueNotDuplicateNameDirective } from '../validators/tagset-value-not-duplicate-name.directive';
import { UriValidator } from '../validators/uri-validator.directive';
import { WhitespacesValidatorDirective } from '../validators/whitespaces-validator.directive';

const PRIMENG_MODULES = [
  ButtonModule,
  TableModule,
  MultiSelectModule,
  DropdownModule,
  InputSwitchModule,
  ListboxModule,
  MenubarModule,
  DialogModule,
  ConfirmDialogModule,
  ToastModule,
  ColorPickerModule,
  TreeModule,
  TooltipModule,
  ContextMenuModule,
  TreeSelectModule,
  CheckboxModule,
  TreeTableModule,
  PanelModule,
  RadioButtonModule,
  SkeletonModule,
  ToggleButtonModule,
  TagModule,
  OverlayPanelModule,
  SplitterModule,
  SelectButtonModule,
  ScrollPanelModule,
  FieldsetModule,
  ToolbarModule,
  MenuModule,
  EditorModule,
  TabViewModule,
  AutoCompleteModule,
  CardModule,
  InputNumberModule,
  PaginatorModule,
];

const DIRECTIVES = [
  TagsetValueNotDuplicateNameDirective,
  WhitespacesValidatorDirective,
  NotDuplicateNameDirective,
  UriValidator
];

const COMPONENTS = [
  PopupDeleteItemComponent,
  AutocompleteCheckboxComponent,
  DoubleAutocompleteComponent,
];

const PIPES = [
  ShouldBeEditablePipe,
];

@NgModule({
  declarations: [
    DIRECTIVES,
    COMPONENTS,
    PIPES,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    PRIMENG_MODULES
  ],
  exports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    PRIMENG_MODULES,
    DIRECTIVES,
    COMPONENTS,
    PIPES,
  ]
})
export class SharedModule { }
