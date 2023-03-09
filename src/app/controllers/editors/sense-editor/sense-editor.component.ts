import { AfterViewInit, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { CommonService } from 'src/app/services/common.service';
import { LexiconService } from 'src/app/services/lexicon.service';

@Component({
  selector: 'app-sense-editor',
  templateUrl: './sense-editor.component.html',
  styleUrls: ['./sense-editor.component.scss']
})
export class SenseEditorComponent implements OnInit, AfterViewInit, OnDestroy {
  private subscription!: Subscription;

  noteInput?: string;
  definitionInput?: string;
  referenceInput?: string;
  attestationsList: any[] = [];
  loading?: boolean;

  @Input() instanceName!: string;

  lastUpdate?: string = '';

  constructor(
    private commonService: CommonService,
    private lexiconService: LexiconService
  ) { }

  ngOnInit(): void {
    this.loadData();
  }

  ngAfterViewInit(): void {
    this.subscription = this.commonService.notifyObservable$.subscribe((res) => {
      if (res.hasOwnProperty('option') && res.option === 'sense_selected' && res.value === this.instanceName) {
        this.instanceName = res.value;
        this.loadData();
      }
    })
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  loadData() {
    this.loading = true;

    this.loadSense();
  }

  private loadSense() {
    this.lexiconService.getSense(this.instanceName).subscribe({
      next: (data: any) => {
        this.definitionInput = data.definition.find((el: any) => el.propertyID === 'definition').propertyValue;
        this.noteInput = data.note;

        this.attestationsList = data.links.find((el: any) => el.type === 'Attestation').elements.map((att: any) => ({
          name: att['label'],
          code: att['label']
        }));

        this.lastUpdate = data.lastUpdate ? new Date(data.lastUpdate).toLocaleString() : '';

        this.loading = false;
      },
      error: (error: any) => {
        console.error(error);
      }
    })
  }
}
