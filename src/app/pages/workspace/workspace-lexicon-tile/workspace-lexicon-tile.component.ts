import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { TreeNode } from 'primeng/api';
import { TreeTable } from 'primeng/treetable';
import { LexicalEntryRequest, searchModeEnum } from 'src/app/models/lexicon/lexical-entry-request.model';
import { LexicalEntry, LexicalEntryType } from 'src/app/models/lexicon/lexical-entry.model';
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
  public selectedNode?: TreeNode;

  public results: TreeNode<LexicalEntry>[] = [];

  @ViewChild('lexicalEntry') lexicalEntryTree: any;
  /* @ViewChild('tt') public tt!: TreeTable; */

  constructor(private element: ElementRef,
    private lexiconService: LexiconService) { }

/*     ngAfterViewInit()
    {
      this.tt.onNodeSelect
      .subscribe((event:any) => {
  
      })
    } */

  ngOnInit(): void {
    this.cols = [
      { field: 'name', header: '' },
      { field: 'creator', header: 'Autore' },
      { field: 'creationDate', header: 'Data creazione' },
      { field: 'lastUpdate', header: 'Data modifica' },
      { field: 'status', header: 'Stato' },
    ];

    /*     this.results =
          [
            {
              data: {
                name: 'Lexical entry',
                creator: "Carmelo",
                creationDate: "25/12/21",
                lastUpdate: "30/12/21",
                status: "Ok"
              },
              children: [
                {
                  data: {
                    name: 'Form(tot.form)',
                    creator: "Carmelo",
                    creationDate: "25/12/21",
                    lastUpdate: "30/12/21",
                    status: ""
                  },
                  children: [
                    {
                      data: {
                        name: 'MUSabbacchiareVERB_PHUabbacchi_S1CP',
                        creator: "Carmelo",
                        creationDate: "25/12/21",
                        lastUpdate: "30/12/21",
                        status: ""
                      }
                    }]
                },
                {
                  data: {
                    name: 'Sense(tot.sense)',
                    creator: "Carmelo",
                    creationDate: "25/12/21",
                    lastUpdate: "30/12/21",
                    status: ""
                  },
                  children: [
                    {
                      data: {
                        name: 'USemTH75accedere',
                        creator: "Carmelo",
                        creationDate: "25/12/21",
                        lastUpdate: "30/12/21",
                        status: ""
                      }
                    }]
                }
              ]
            }
          ]; */

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

    this.lexiconService.getLexicalEntriesList(this.parameters).subscribe({
      next: (data: any) => {
        this.results = [];
        this.results = data['list'].map((val: any) => ({
          data: {
            name: val['label'],
            instanceName: val['lexicalEntryInstanceName'],
            label: val['label'],
            creator: val['creator'],
            creationDate: val['creationDate'] ? new Date(val['creationDate']).toLocaleString() : '',
            lastUpdate: val['lastUpdate'] ? new Date(val['lastUpdate']).toLocaleString() : '',
            status: val['status'],
            uri: val['lexicalEntry'],
            type: LexicalEntryType.LEXICAL_ENTRY
          },
          children: [{
            data: {
              name: 'form (0)',
              type: LexicalEntryType.FORM
            }
          },
          {
            data: {
              name: 'sense (0)',
              type: LexicalEntryType.SENSE
            }
          }]
        }))
        this.counter = data['totalHits'];
      },
      error: (error: any) => {

      }
    })

    this.initSelectFields();
  }

  onNodeExpand(event: any): void {
    switch (event.node.data.type) {
      case LexicalEntryType.LEXICAL_ENTRY:
        this.lexiconService.getElements(event.node.data.instanceName).subscribe({
          next: (data: any) => {
            let formCildNode = event.node.children.find((el: any) => el.data.type === LexicalEntryType.FORM);
            let senseCildNode = event.node.children.find((el: any) => el.data.type === LexicalEntryType.SENSE);
            let countFormChildren = data['elements'].find((el: { label: string; }) => el.label === 'form').count;
            let countSenseChildren = data['elements'].find((el: { label: string; }) => el.label === 'sense').count;

            formCildNode.data.name = `form (${countFormChildren})`;

            if (countFormChildren > 0) {
              formCildNode.children = [{ data: { name: '' } }];
            }

            senseCildNode.data.name = `sense (${countSenseChildren})`;

            if (countSenseChildren > 0) {
              senseCildNode.children = [{ data: { name: '' } }];
            }
          },
          error: (error: any) => { }
        });
        break;
      case LexicalEntryType.FORM:
        this.lexiconService.getLexicalEntryForms(event.node.parent.data.instanceName).subscribe({
          next: (data: any) => {
            event.node.children = data.map((val: any) => ({
              data: {
                name: val['label'],
                instanceName: val['formInstanceName'],
                label: val['label'],
                creator: val['creator'],
                creationDate: val['creationDate'] ? new Date(val['creationDate']).toLocaleString() : '',
                lastUpdate: val['lastUpdate'] ? new Date(val['lastUpdate']).toLocaleString() : '',
                status: val['status'],
                uri: val['form'],
                type: LexicalEntryType.FORM
              }
            }));
            //refresh the data
            this.results = [...this.results];
          },
          error: () => { }
        })
        break;
      case LexicalEntryType.SENSE:
        this.lexiconService.getLexicalEntrySenses(event.node.parent.data.instanceName).subscribe({
          next: (data: any) => {
            event.node.children = data.map((val: any) => ({
              data: {
                name: val['label'],
                instanceName: val['senseInstanceName'],
                label: val['label'],
                creator: val['creator'],
                creationDate: val['creationDate'] ? new Date(val['creationDate']).toLocaleString() : '',
                lastUpdate: val['lastUpdate'] ? new Date(val['lastUpdate']).toLocaleString() : '',
                status: val['status'],
                uri: val['sense'],
                type: LexicalEntryType.SENSE
              }
            }));
            //refresh the data
            this.results = [...this.results];
          },
          error: () => { }
        })
        break;
    }
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

  onNodeSelect(event: any) {
    //TODO L'EVENTO NON VIENE SCATENATO
    console.log('Selected ' + event.node.data.uri);
  }

  onNodeUnselect(event: any) {
    //TODO EVENTO NON VIENE SCATENATO
    console.log('Unselected ' + event.node.data.uri);
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
    this.lexiconService.getLexicalEntriesList(newPar).subscribe({
      next: (data: any) => {
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
