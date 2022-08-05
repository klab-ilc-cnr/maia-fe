import { WorkspaceService } from 'src/app/services/workspace.service';
import { Workspace } from 'src/app/model/workspace.model';
import { Component, OnInit } from '@angular/core';
import { TextRow } from 'src/app/model/tile/text-row';

@Component({
  selector: 'app-workspace-text-window',
  templateUrl: './workspace-text-window.component.html',
  styleUrls: ['./workspace-text-window.component.scss']
})
export class WorkspaceTextWindowComponent implements OnInit {

  textId: number | undefined;
  rows: TextRow[] | undefined = [];
  constructor(private workspaceService: WorkspaceService) { }

  ngOnInit(): void {
    if (!this.textId) {
      return;
    }

    this.workspaceService.retrieveText(this.textId).subscribe(data => {
      let rawText = JSON.parse(JSON.stringify(data.text))
      let t = rawText.split(/(?<=\.)/g);
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
    // const start = event.target.selectionStart;
    // const end = event.target.selectionEnd;
    // var t = window!.getSelection()?.anchorNode?.textContent?.substring( window?.getSelection()?.anchorOffset!, window?.getSelection()?.focusOffset )
    // console.log(event, start, end, window.getSelection(), t)

    // console.log(window!.getSelection()?.anchorNode?.textContent)
    // console.log(window!.getSelection()?.anchorOffset!, window?.getSelection()?.focusOffset)
  }

}
