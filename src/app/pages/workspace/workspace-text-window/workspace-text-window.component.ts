import { Annotation } from './../../../model/annotation/annotation';
import { WorkspaceService } from 'src/app/services/workspace.service';
import { Workspace } from 'src/app/model/workspace.model';
import { Component, OnInit, ViewChild } from '@angular/core';
import { TextRow } from 'src/app/model/tile/text-row';
import { SelectItem } from 'primeng/api';
import { LayerService } from 'src/app/services/layer.service';
import { Layer } from 'src/app/model/layer.model';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-workspace-text-window',
  templateUrl: './workspace-text-window.component.html',
  styleUrls: ['./workspace-text-window.component.scss']
})
export class WorkspaceTextWindowComponent implements OnInit {

  height: number = window.innerHeight / 2;
  tableHeight: number = window.innerHeight / 2;
  textId: number | undefined;
  rows: TextRow[] = [];
  selectedLayer: any;

  layerOptions = new Array<SelectItem>();

  constructor(
    private workspaceService: WorkspaceService,
    private layerService: LayerService
  ) { }

  ngOnInit(): void {
    if (!this.textId) {
      return;
    }

    this.updateHeight(this.height)

    this.layerService.retrieveLayers()
      .subscribe((data: Layer[]) => {
        this.layerOptions = data.map(item => ({ label: item.name, value: item.id }));

        this.layerOptions.sort((a, b) => (a.label && b.label && a.label.toLowerCase() > b.label.toLowerCase()) ? 1 : -1);

        this.layerOptions.unshift({
          label: "Nessuna annotazione",
          value: -1
        });

        this.selectedLayer = -1;
      });

    this.workspaceService.retrieveText(this.textId).subscribe(data => {
      let rawText = JSON.parse(JSON.stringify(data.text))
      let t = rawText.split(/(?<=[\.!\?])/g);
      let row_id = 0;
      let start = 0;
      let end = rawText.length;

      t.forEach((el : any) => {
        this.rows?.push({
          id: row_id + 1,
          text: el,
          startIndex: start,
          endIndex: start + el.length
        })

        start += el.length;
      })

      console.log(data, this.rows, data.text?.length, start)
    })
  }

  selectionchange(event: any) {
    console.log(event)

    // const start = event.target.selectionStart;
    // const end = event.target.selectionEnd;
    // var t = window!.getSelection()?.anchorNode?.textContent?.substring( window?.getSelection()?.anchorOffset!, window?.getSelection()?.focusOffset )
    // console.log(event, start, end, window.getSelection(), t)

    // console.log(window!.getSelection()?.anchorNode?.textContent)
    // console.log(window!.getSelection()?.anchorOffset!, window?.getSelection()?.focusOffset)
  }

  changeLayer(event: any) {
    console.log('hello', this.selectedLayer, event)
  }

  resetDropdownSelection(event: any) {

  }

  updateHeight(newHeight: any) {
    console.log(this.height)
    this.height = newHeight - 64;
    this.tableHeight = this.height - 40;
    console.log(this.height, this.tableHeight)
  }
}
