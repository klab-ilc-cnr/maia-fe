import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { TreeNode } from 'primeng/api';
import { LexicalEntryRequest, searchModeEnum } from 'src/app/models/lexicon/lexical-entry-request.model';
import { LexicalEntry } from 'src/app/models/lexicon/lexical-entry.model';
import { LexiconService } from 'src/app/services/lexicon.service';

@Component({
  selector: 'app-workspace-lexicon-tile',
  templateUrl: './workspace-lexicon-tile.component.html',
  styleUrls: ['./workspace-lexicon-tile.component.scss']
})
export class WorkspaceLexiconTileComponent implements OnInit {

  private parameters: LexicalEntryRequest | undefined;
  private offset: number | undefined;
  private limit: number | undefined;
  private show: boolean | undefined;
  private nodes: any;

  public counter: number | undefined;
  public filterForm: any;
  public searchIconSpinner: boolean = false;
  public languages: any;
  public types: any;
  public authors: any;
  public partOfSpeech: any;
  public selectedType: any;
  public cols!: any[];
  public internalColType!: any[];
  public internalColForm!: any[];
  public internalColSense!: any[];
  public results: TreeNode<LexicalEntry>[] = [];

  @ViewChild('lexicalEntry') lexicalEntryTree: any;
  //@ViewChild('svg') public element!: ElementRef;

  constructor(private element: ElementRef,
    private lexiconService: LexiconService) { }

  ngOnInit(): void {
    this.cols = [
      { field: 'creator', header: 'Autore' },
      { field: 'creationDate', header: 'Data creazione' },
      { field: 'lastUpdate', header: 'Data modifica' },
      { field: 'status', header: 'Stato' },
    ];

    this.internalColType = [
      { field: 'Type', header: '' }
    ];

    this.internalColForm = [
      { field: 'formInstanceName', header: '' }
    ];

    this.internalColSense = [
      { field: 'senseInstanceName', header: '' }
    ];
    
    this.results =
      [
        {
          data: {
            creator: "Carmelo",
            creationDate: "25/12/21",
            lastUpdate: "30/12/21",
            status: "Ok"
          },
          children: [
            {
              data: {
                type: "form",
              },
              children: [
                {
                  data: {
                    formInstanceName: "MUSabbacchiareVERB_PHUabbacchi_S1CP",
                  }
                }]
            },
            {
              data: {
                type: "sense"
              },
              children: [
                {
                  data: {
                    senseInstanceName: "USemTH75accedere"
                  }
                }]
            }
          ]
        }
      ];

    this.filterForm = new FormGroup({
      text: new FormControl(''),
      searchMode: new FormControl('startsWith'),
      type: new FormControl(''),
      pos: new FormControl(''),
      formType: new FormControl('entry'),
      author: new FormControl(''),
      lang: new FormControl(''),
      status: new FormControl('')
    });

    this.searchIconSpinner = false;
    this.offset = 0;
    this.limit = 500;
    this.show = false;
    this.counter = 0;

    this.parameters = {
      text: "",
      searchMode: searchModeEnum.startsWith,
      type: "",
      pos: "",
      formType: "entry",
      author: "",
      lang: "",
      status: "",
      offset: this.offset,
      limit: this.limit
    }

    this.initSelectFields();
  }

  public resetFields() {
    this.filterForm.value.text = '';
    this.filterForm.reset(this.filterForm.value);
    setTimeout(() => {
      this.filterForm.get('text').setValue('', { eventEmit: false });
      this.lexicalEntriesFilter(this.parameters);
      this.lexicalEntryTree.treeModel.update();
      this.updateTreeView();
    }, 500);
  }

  public updateTreeView() {

    setTimeout(() => {
      this.lexicalEntryTree.sizeChanged();
      $('.lexical-tooltip').tooltip();
    }, 1000);
  }

  private initSelectFields() {
    this.lexiconService.getLanguages().subscribe({
      next: (data: any) => {
        this.languages = data;
      },
      error: () => { }
    });

    this.lexiconService.getTypes().subscribe({
      next: (data: any) => {
        this.types = data;
      },
      error: () => { }
    });

    this.lexiconService.getAuthors().subscribe({
      next: (data: any) => {
        this.authors = data;
      },
      error: () => { }
    });

    this.lexiconService.getPos().subscribe({
      next: (data: any) => {
        this.partOfSpeech = data;
      },
      error: () => { }
    })
  }

  private lexicalEntriesFilter(newPar: any) {

    setTimeout(() => {
      const viewPort_prova = this.element.nativeElement.querySelector('tree-viewport') as HTMLElement;
      viewPort_prova.scrollTop = 0
    }, 300);

    this.searchIconSpinner = true;
    let parameters = newPar;
    parameters['offset'] = this.offset;
    parameters['limit'] = this.limit;
    console.log(parameters)
    this.lexiconService.getLexicalEntriesList(newPar).subscribe({
      next: (data: any) => {
        console.log(data)
        if (data['list'].length > 0) {
          this.show = false;
        } else {
          this.show = true;
        }
        this.nodes = data['list'];
        this.counter = data['totalHits'];
        this.lexicalEntryTree.treeModel.update();
        this.updateTreeView();
        this.searchIconSpinner = false;
      },
      error: () => {

      }
    })
  }
}
