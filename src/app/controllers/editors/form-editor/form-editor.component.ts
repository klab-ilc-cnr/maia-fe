import { AfterViewInit, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { DropdownField } from 'src/app/models/dropdown-field';
import { CommonService } from 'src/app/services/common.service';
import { LexiconService } from 'src/app/services/lexicon.service';

@Component({
  selector: 'app-form-editor',
  templateUrl: './form-editor.component.html',
  styleUrls: ['./form-editor.component.scss']
})
export class FormEditorComponent implements OnInit, AfterViewInit, OnDestroy {
  private subscription!: Subscription;

  writtenRepresentationInput?: string;
  typesDropdownList: DropdownField[] = [];
  selectedType?: DropdownField;
  noteInput?: string;
  attestationsList: any[] = [];
  loading?: boolean;

  traitsDropdown: DropdownField[] = [];
  selectedTrait?: DropdownField;
  propertiesDropdown: DropdownField[] = [];
  selectedProperty?: DropdownField;

  morphologicalData!: any;

  @Input() instanceName!: string;

  constructor(
    private lexiconService: LexiconService,
    private commonService: CommonService
  ) { }

  ngOnInit(): void {
    this.loadData();
  }

  ngAfterViewInit(): void {
    this.subscription = this.commonService.notifyObservable$.subscribe((res) => {
      if (res.hasOwnProperty('option') && res.option === 'form_selected') {
        this.instanceName = res.value;
        this.loadData();
      }
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  loadData() {
    this.loading = true;
    this.loadFormTypes();
  }

  loadProperties(event: any) {
    if (event.value.code === '') {
      this.propertiesDropdown = [];
      return;
    }
    const traitId = event.value.code;
    this.propertiesDropdown = [{
      name: '--none--',
      code: ''
    }, ...this.morphologicalData.find((el: any) => el.propertyId === traitId).propertyValues.map((val: any) => ({
      name: val['valueLabel'],
      code: val['valueId']
    }))];
  }

  private loadForm() {
    this.lexiconService.getForm(this.instanceName).subscribe({
      next: (data: any) => {
        this.writtenRepresentationInput = data.label.find((el: any) => el.propertyID === 'writtenRep').propertyValue;

        this.selectedType = this.typesDropdownList.find(el => el.code === data.type);

        this.noteInput = data.note;
        this.attestationsList = data.links.find((el: any) => el.type === 'Attestation').elements.map((att: any) => ({
          name: att['label'],
          code: att['label']
        }));
        console.info(data.morphology);
        data.morphology.forEach((element: any) => {

        });

        this.loading = false;
      },
      error: (error: any) => {
        console.error(error);
      }
    })
  }

  private loadFormTypes() {
    this.lexiconService.getFormTypes().subscribe({
      next: (data: any) => {
        this.typesDropdownList = [{
          name: '--none--',
          code: ''
        }, ...data.map((val: any) => ({
          name: val['valueLabel'],
          code: val['valueId']
        }))];

        this.loadMorphologicalInfo();
      },
      error: (error: any) => {
        console.error(error);
      }
    })
  }

  private loadMorphologicalInfo() {
    this.lexiconService.getMorphology().subscribe({
      next: (data: any) => {
        this.morphologicalData = data;
        this.traitsDropdown = [{
          name: '--none--',
          code: ''
        }, ...data.map((val: any) => ({
          name: val['propertyLabel'],
          code: val['propertyId']
        }))];

        this.loadForm();
      },
      error: (error: any) => {
        console.error(error);
      }
    })
  }
}
