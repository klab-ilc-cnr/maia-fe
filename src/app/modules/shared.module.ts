import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { MultiSelectModule } from 'primeng/multiselect';
import { DropdownModule } from 'primeng/dropdown';
import { InputSwitchModule } from 'primeng/inputswitch';
import { ListboxModule } from 'primeng/listbox';
import { MenubarModule } from 'primeng/menubar';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ColorPickerModule } from 'primeng/colorpicker';
import { TreeModule } from 'primeng/tree';
import { TooltipModule } from 'primeng/tooltip';
import { ContextMenuModule } from 'primeng/contextmenu';
import { TreeSelectModule } from 'primeng/treeselect';
import { PanelModule } from 'primeng/panel';
import { RadioButtonModule } from 'primeng/radiobutton';
import { CheckboxModule } from 'primeng/checkbox';
import { TreeTableModule } from 'primeng/treetable';
import { SkeletonModule } from 'primeng/skeleton';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { TagModule } from 'primeng/tag';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { EditorModule } from 'primeng/editor';
import { FieldsetModule } from 'primeng/fieldset';
import { MenuModule } from 'primeng/menu';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SplitterModule } from 'primeng/splitter';
import { TabViewModule } from 'primeng/tabview';
import { ToolbarModule } from 'primeng/toolbar';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TagsetValueNotDuplicateNameDirective } from '../validators/tagset-value-not-duplicate-name.directive';
import { NotDuplicateNameDirective } from '../validators/not-duplicate-name.directive';
import { WhitespacesValidatorDirective } from '../validators/whitespaces-validator.directive';
import { UriValidator } from '../validators/uri-validator.directive';
import { PopupDeleteItemComponent } from '../controllers/popup/popup-delete-item/popup-delete-item.component';
import { DynamicFormFieldComponent } from '../forms/dynamic-form-field/dynamic-form-field.component';
import { DynamicFormComponent } from '../forms/dynamic-form/dynamic-form.component';

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
  AutoCompleteModule
];

const DIRECTIVES = [
  TagsetValueNotDuplicateNameDirective,
  WhitespacesValidatorDirective,
  NotDuplicateNameDirective,
  UriValidator
];

const COMPONENTS = [
  PopupDeleteItemComponent,
  DynamicFormFieldComponent,
  DynamicFormComponent
];

@NgModule({
  declarations: [
    DIRECTIVES,
    COMPONENTS
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
    COMPONENTS
  ]
})
export class SharedModule { }
