import { Component, ElementRef, EventEmitter, Input, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { SelectItem, TreeNode } from 'primeng/api';
import { TreeTable } from 'primeng/treetable';
import { Subscription } from 'rxjs';
import { formTypeEnum, LexicalEntryRequest, searchModeEnum } from 'src/app/models/lexicon/lexical-entry-request.model';
import { LexicalEntry, LexicalEntryType } from 'src/app/models/lexicon/lexical-entry.model';
import { CommonService } from 'src/app/services/common.service';
import { LexiconService } from 'src/app/services/lexicon.service';
import { WorkspaceComponent } from '../workspace.component';

@Component({
  selector: 'app-workspace-lexicon-tile',
  templateUrl: './workspace-lexicon-tile.component.html',
  styleUrls: ['./workspace-lexicon-tile.component.scss']
})
export class WorkspaceLexiconTileComponent implements OnInit {

  private subscription!: Subscription;
  private parameters: LexicalEntryRequest | undefined;
  private offset!: number;
  private limit!: number;

  public counter: number | undefined;
  public filterForm: any;
  public searchIconSpinner: boolean = false;
  public selectLanguages!: SelectItem[];
  public selectTypes!: SelectItem[];
  public selectAuthors!: SelectItem[];
  public selectPartOfSpeech!: SelectItem[];
  public selectStatuses!: SelectItem[];
  public selectEntries!: SelectItem[];
  public selectedLanguage: any;
  public selectedType: any;
  public selectedAuthor: any;
  public selectedPartOfSpeech: any;
  public selectedStatus: any;
  public selectedEntry!: formTypeEnum;
  public cols!: any[];
  public selectedNode?: TreeNode;
  public loading: boolean = false;
  public showLabelName?: boolean;
  public searchMode!: searchModeEnum;
  public display: boolean = false;
  public checked!: boolean;
  public searchTextInput!: string;
  public LexicalEntryType = LexicalEntryType;

  public results: TreeNode<LexicalEntry>[] = [];

  @ViewChild('lexicalEntry') lexicalEntryTree: any;
  /* @ViewChild('tt') public tt!: TreeTable; */

  constructor(private lexiconService: LexiconService,
    private commonService: CommonService) { }

  /*   ngAfterViewInit() {
      this.tt.onNodeSelect
        .subscribe((event: any) => {
  
        })
    } */

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  ngOnInit(): void {
    this.cols = [
      { field: 'name', header: '', width: '35%', display:'true'},
      { field: 'creator', header: 'Autore', width: '15%', display:'true'},
      { field: 'creationDate', header: 'Data creazione', width: '20%', display:'true'},
      { field: 'lastUpdate', header: 'Data modifica', width: '20%', display:'true'},
      { field: 'status', header: 'Stato', width: '10%', display:'true'},
      { field: 'type', display:'false'}
    ];

    this.subscription = this.commonService.notifyObservable$.subscribe((res) => {
      if (res.hasOwnProperty('option') && res.option === 'tag_clicked') {
        this.alternateLabelInstanceName();
        this.showLabelName = !this.showLabelName;
      }
    });

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

    this.searchIconSpinner = false;
    this.showLabelName = true;

    this.resetFilters();
    this.initSelectFields();
    this.initParameters();

  }

  loadNodes(event: any) {
    this.loading = true;

    this.lexiconService.getLexicalEntriesList(this.parameters).subscribe({
      next: (data: any) => {
        this.results = [];
        this.results = data['list'].map((val: any) => ({
          data: {
            name: this.showLabelName ? val['label'] : val['lexicalEntryInstanceName'],
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
              type: LexicalEntryType.FORMS_ROOT
            }
          },
          {
            data: {
              name: 'sense (0)',
              type: LexicalEntryType.SENSES_ROOT
            }
          }]
        }))
        this.counter = data['totalHits'];

        this.loading = false;
        this.checked = false;
      },
      error: (error: any) => {

      }
    })
  }

  alternateLabelInstanceName() {
    this.results.forEach(node => this.treeTraversalAlternateLabelInstanceName(node))
  }

  onNodeExpand(event: any): void {
    this.loading = true;

    switch (event.node.data.type) {
      case LexicalEntryType.LEXICAL_ENTRY:
        this.lexiconService.getElements(event.node.data.instanceName).subscribe({
          next: (data: any) => {
            let formCildNode = event.node.children.find((el: any) => el.data.type === LexicalEntryType.FORMS_ROOT);
            let senseCildNode = event.node.children.find((el: any) => el.data.type === LexicalEntryType.SENSES_ROOT);
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

            this.loading = false;
          },
          error: (error: any) => { }
        });
        break;
      case LexicalEntryType.FORMS_ROOT:
        this.lexiconService.getLexicalEntryForms(event.node.parent.data.instanceName).subscribe({
          next: (data: any) => {
            event.node.children = data.map((val: any) => ({
              data: {
                name: this.showLabelName ? val['label'] : val['formInstanceName'],
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

            this.loading = false;
          },
          error: () => { }
        })
        break;
      case LexicalEntryType.SENSES_ROOT:
        this.lexiconService.getLexicalEntrySenses(event.node.parent.data.instanceName).subscribe({
          next: (data: any) => {
            event.node.children = data.map((val: any) => ({
              data: {
                name: this.showLabelName ? val['label'] : val['senseInstanceName'],
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

            this.loading = false;
          },
          error: () => { }
        })
        break;
    }
  }

  onNodeSelect(event: any) {
    console.log('Selected ' + event.node.data.uri);
  }

  onNodeUnselect(event: any) {
    console.log('Unselected ' + event.node.data.uri);
  }

  showDialog() {
    this.display = true;
  }

  handleButtonChange(event: any) {
    if (event.checked) {
      this.resetFilters();
      this.onChangeFilter();
    }

    this.search();
  }

  search() {
    this.loadNodes(undefined);
  }

  onChangeFilter() {
    this.checked = true;

    this.initParameters();
  }

  private resetFilters() {
    this.counter = 0;
    this.offset = 0;
    this.limit = 500;
    this.searchTextInput = '';
    this.searchMode = searchModeEnum.equals;
    this.selectedLanguage = undefined;
    this.selectedType = undefined;
    this.selectedAuthor = undefined;
    this.selectedPartOfSpeech = undefined;
    this.selectedStatus = undefined;
    this.selectedEntry = formTypeEnum.entry;
    this.checked = false;
  }

  private initParameters() {
    this.parameters = {
      text: this.searchTextInput ?? '*',
      searchMode: this.searchMode,
      type: this.selectedType ?? '',
      pos: this.selectedPartOfSpeech ?? '',
      formType: this.selectedEntry ?? '',
      author: this.selectedAuthor ?? '',
      lang: this.selectedLanguage ?? '',
      status: this.selectedStatus ?? '',
      offset: this.offset,
      limit: this.limit
    }
  }

  private treeTraversalAlternateLabelInstanceName(node: TreeNode): void {
    if (node.data?.name === node.data?.label) {
      node.data!.name = node.data?.instanceName;
    }
    else if (node.data?.name === node.data?.instanceName) {
      node.data!.name = node.data?.label;
    }

    if (node.children) {
      node.children.forEach(childNode => {
        this.treeTraversalAlternateLabelInstanceName(childNode);
      });
    }
  }

  private initSelectFields() {
    this.lexiconService.getLanguages().subscribe({
      next: (languages: any) => {
        this.selectLanguages = [];
        languages.sort((a: any, b: any) => a.label.localeCompare(b.label))

        for (let i = 0; i < languages.length; i++) {
          this.selectLanguages.push({ label: `${languages[i].label}`, value: languages[i].label });
        }
      },
      error: () => { }
    });

    this.lexiconService.getTypes().subscribe({
      next: (types: any) => {
        this.selectTypes = [];
        types.sort((a: any, b: any) => a.label.localeCompare(b.label))

        for (let i = 0; i < types.length; i++) {
          this.selectTypes.push({ label: `${types[i].label}`, value: types[i].label });
        }
      },
      error: () => { }
    });

    this.lexiconService.getAuthors().subscribe({
      next: (authors: any) => {
        this.selectAuthors = [];
        authors.sort((a: any, b: any) => a.label.localeCompare(b.label))

        for (let i = 0; i < authors.length; i++) {
          this.selectAuthors.push({ label: `${authors[i].label}`, value: authors[i].label });
        }
      },
      error: () => { }
    });

    this.lexiconService.getPos().subscribe({
      next: (partOfSpeech: any) => {
        this.selectPartOfSpeech = [];
        partOfSpeech.sort((a: any, b: any) => a.label.localeCompare(b.label))

        for (let i = 0; i < partOfSpeech.length; i++) {
          this.selectPartOfSpeech.push({ label: `${partOfSpeech[i].label}`, value: partOfSpeech[i].label });
        }
      },
      error: () => { }
    })

    this.lexiconService.getStatus().subscribe({
      next: (statuses: any) => {
        this.selectStatuses = [];
        statuses.sort((a: any, b: any) => a.label.localeCompare(b.label))

        for (let i = 0; i < statuses.length; i++) {
          this.selectStatuses.push({ label: `${statuses[i].label}`, value: statuses[i].label });
        }
      },
      error: () => { }
    })

    this.selectEntries = [
      { label: formTypeEnum.entry, value: formTypeEnum.entry },
      { label: formTypeEnum.flexed, value: formTypeEnum.flexed }
    ]
  }

  /*   private initSelectFields() {
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
    } */
}
