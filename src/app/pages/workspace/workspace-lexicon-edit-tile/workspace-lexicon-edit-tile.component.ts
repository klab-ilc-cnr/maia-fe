import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { TreeNode } from 'primeng/api';
import { Subscription } from 'rxjs';
import { LexicalEntry, LexicalEntryType } from 'src/app/models/lexicon/lexical-entry.model';
import { CommonService } from 'src/app/services/common.service';
import { LexiconService } from 'src/app/services/lexicon.service';

@Component({
  selector: 'app-workspace-lexicon-edit-tile',
  templateUrl: './workspace-lexicon-edit-tile.component.html',
  styleUrls: ['./workspace-lexicon-edit-tile.component.scss']
})
export class WorkspaceLexiconEditTileComponent implements OnInit {
  private subscription!: Subscription;

  public selectedType?: LexicalEntryType;
  public selectedNode?: TreeNode;
  public lexicalEntryTree: TreeNode<LexicalEntry>[] = [];
  public cols!: any[];
  public loading: boolean = false;
  public showLabelName?: boolean;

  constructor(private lexiconService: LexiconService,
    private commonService: CommonService) { }

  ngOnInit(): void {
    this.selectedType //il set viene effettuato dal workspace component

    this.cols = [
      { field: 'name', header: '', width: '35%', display: 'true' },
      { field: 'creator', header: 'Autore', width: '15%', display: 'true' },
      { field: 'creationDate', header: 'Data creazione', width: '20%', display: 'true' },
      { field: 'lastUpdate', header: 'Data modifica', width: '20%', display: 'true' },
      { field: 'status', header: 'Stato', width: '10%', display: 'true' },
      { field: 'type', display: 'false' },
      { field: 'uri', display: 'false' }
    ];

    this.subscription = this.commonService.notifyObservable$.subscribe((res) => {
      if (res.hasOwnProperty('option') && res.option === 'tag_clicked_edit_tile') {
        this.alternateLabelInstanceName();
        this.showLabelName = !this.showLabelName;
      }
    });
  }

  alternateLabelInstanceName() {
    this.lexicalEntryTree.forEach(node => this.treeTraversalAlternateLabelInstanceName(node))
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
            this.lexicalEntryTree = [...this.lexicalEntryTree];

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
            this.lexicalEntryTree = [...this.lexicalEntryTree];

            this.loading = false;
          },
          error: () => { }
        })
        break;
    }
  }

  onNodeSelect(event: any) {
    console.log('Selected ' + event.node.data);
  }

  onNodeUnselect(event: any) {
    console.log('Unselected ' + event.node.data.uri);
  }
}
