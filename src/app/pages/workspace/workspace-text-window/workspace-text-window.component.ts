import { AnnotationService } from 'src/app/services/annotation.service';
import { SpanCoordinates } from './../../../model/annotation/span-coordinates';
import { Annotation } from './../../../model/annotation/annotation';
import { WorkspaceService } from 'src/app/services/workspace.service';
import { Workspace } from 'src/app/model/workspace.model';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { TextRow } from 'src/app/model/text/text-row';
import { SelectItem } from 'primeng/api';
import { LayerService } from 'src/app/services/layer.service';
import { Layer } from 'src/app/model/layer.model';
import { NgForm } from '@angular/forms';
import { TextLine } from 'src/app/model/text/text-line';

@Component({
  selector: 'app-workspace-text-window',
  templateUrl: './workspace-text-window.component.html',
  styleUrls: ['./workspace-text-window.component.scss']
})
export class WorkspaceTextWindowComponent implements OnInit {

  data: any;
  height: number = window.innerHeight / 2;
  dVerticalLine: string = "M 0 0";
  svgHeight: number = 0;
  tableHeight: number = window.innerHeight / 2;
  textId: number | undefined;
  rows: TextRow[] = [];
  selectedLayer: any;

  sentnumVerticalLine: any;

  @ViewChild('svg') public svg!: ElementRef;
  // svg = document.getElementById('svg');

  layerOptions = new Array<SelectItem>();

  private selectionStart?: number;
  private selectionEnd?: number;

  private visualConfig = {
    spaceBeforeTextLine: 8,
    spaceAfterTextLine: 8,
    stdTextLineHeight: 16,
    stdTextOffsetX: 37,
    spaceBeforeVerticalLine: 2,
    spaceAfterVerticalLine: 2,
    font: "13px monospace"
  }

  @ViewChild('el') public el!: ElementRef;
  annotation = new Annotation();

  constructor(
    private annotationService: AnnotationService,
    private workspaceService: WorkspaceService,
    private layerService: LayerService
  ) {
    console.log(document.documentElement.style.getPropertyValue('--text-font-family'));
    console.log(document.documentElement.style.getPropertyValue('--text-font-size'));
  }

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

    // this.workspaceService.retrieveText(this.textId).subscribe(data => {
    //   let rawText = JSON.parse(JSON.stringify(data.text))
    //   let t = rawText.split(/(?<=[\.!\?])/g);
    //   let row_id = 0;
    //   let start = 0;
    //   let end = rawText.length;

    //   t.forEach((el : any) => {
    //     this.rows?.push({
    //       id: row_id + 1,
    //       text: el,
    //       startIndex: start,
    //       endIndex: start + el.length
    //     })

    //     start += el.length;
    //   })

    //   console.log(data, this.rows, data.text?.length, start)
    // })

    this.workspaceService.retrieveTextContent(this.textId).subscribe(data => {
      this.data = data;
      this.renderData();

    })

  }

  updateTextEditorSize() {
    this.renderData();
  }

  private renderData() {
    this.rows = [];

    let rawText = JSON.parse(JSON.stringify(this.data.text))
    let sentences = rawText.split(/(?<=[\.!\?])/g);
    let row_id = 0;
    let start = 0;
    let end = rawText.length;

    console.log(this.svg, this.svg.nativeElement.clientWidth, this.svg.nativeElement.offsetWidth)
    let width = this.svg.nativeElement.clientWidth - 20 - this.visualConfig.stdTextOffsetX;

    let font = getComputedStyle(document.documentElement).getPropertyValue('--text-font-size') + " " + getComputedStyle(document.documentElement).getPropertyValue('--text-font-family')
    this.visualConfig.font = font;

    let linesCounter = 0;
    let yStartRow = 0;
    let yStartLine = 0;
    console.log(this.getComputedTextLength(sentences[0]))
    sentences.forEach((s: any, index: number) => {
      let sWidth = this.getComputedTextLength(s);

      let sLines = new Array<TextLine>();

      let words = s.split(/(?<=\s)/g);
      let stdLineHeight = this.visualConfig.spaceBeforeTextLine + this.visualConfig.spaceAfterTextLine + this.visualConfig.stdTextLineHeight;
      let startLine = start;
      console.log(index, sWidth, " / ", width, " = ", sWidth/width, sWidth/width>1)
      if (sWidth/width > 1) {
        let wordAddedCounter = 0;
        let line = new TextLine();
        let lineWidth = 0;
        line.text = "";

        words.forEach((w: any) => {
          let wordWidth = this.getComputedTextLength(w);
          console.log(index, w, wordWidth)
          if ((lineWidth + wordWidth) <= width) {
            line.text += w;
            wordAddedCounter++;
            lineWidth += wordWidth;

            if (!line.words) {
              line.words = [];
            }

            line.words.push(w);
          }
          else {
            line.startIndex = startLine;
            line.endIndex = startLine + (line.text?.length || 0);
            line.height = stdLineHeight;
            yStartLine += line.height;
            line.yText = yStartLine - this.visualConfig.spaceAfterTextLine;

            sLines.push(JSON.parse(JSON.stringify(line)));

            startLine += (line.text?.length || 0);
            linesCounter++;

            if (wordAddedCounter != words.length) {
              line.text = "";
              lineWidth = 0;
              line.words = [];

              line.text += w;
              wordAddedCounter++;
              lineWidth += wordWidth;
              line.words.push(w);
            }
          }

          if (wordAddedCounter == words.length) {
            line.startIndex = startLine;
            line.endIndex = startLine + (line.text?.length || 0);
            line.height = stdLineHeight;
            yStartLine += line.height;
            line.yText = yStartLine - this.visualConfig.spaceAfterTextLine;

            sLines.push(JSON.parse(JSON.stringify(line)));

            startLine += (line.text?.length || 0);
            linesCounter++;
          }
        })
      }
      else {
        let rHeight = stdLineHeight;
        yStartLine += rHeight;

        let line = {
          text: s,
          words: words,
          height: rHeight,
          yText: yStartLine - this.visualConfig.spaceAfterTextLine,
          startIndex: startLine,
          endIndex: startLine + s.length,
        }

        // yStartLine += line.height;
        // line.yText = yStartLine - this.visualConfig.spaceAfterTextLine;

        sLines.push(line);
        linesCounter++;
      }

      let sLinesCopy = JSON.parse(JSON.stringify(sLines));

      let rowHeight = sLinesCopy.reduce((acc: any, o: any) => acc + o.height, 0);

      this.rows?.push({
        id: row_id + 1,
        height: rowHeight,
        lines: sLinesCopy,
        yBG:  yStartRow,
        yText: sLinesCopy[0].yText - this.visualConfig.spaceAfterTextLine,
        ySentnum: sLinesCopy[sLinesCopy.length - 1].yText,
        text: s,
        words: words,
        startIndex: start,
        endIndex: start + s.length,
      })

      yStartRow += rowHeight;
      start += s.length;
    })

    console.log(this.data, this.rows, this.data.text?.length, start)

    this.svgHeight = this.rows.reduce((acc, o) => acc + (o.height || 0), 0);

    this.dVerticalLine = "M 34 0 L 34 " + this.svgHeight;
  }

  private getComputedTextLength(text: string) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) {
      return text.length;
    }

    context.font = this.visualConfig.font || getComputedStyle(document.body).font;

    return context.measureText(text).width;
  }

  selectionchange(event: any): void {
    console.log("stai selezionando", event)

    // const start = event.target.selectionStart;
    // const end = event.target.selectionEnd;
    // var t = window!.getSelection()?.anchorNode?.textContent?.substring( window?.getSelection()?.anchorOffset!, window?.getSelection()?.focusOffset )
    // console.log(event, start, end, window.getSelection(), t)

    // console.log(window!.getSelection()?.anchorNode?.textContent)
    // console.log(window!.getSelection()?.anchorOffset!, window?.getSelection()?.focusOffset)

    const selection = window.getSelection();
    if (selection != null && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const preSelectionRange = range.cloneRange();
      preSelectionRange.selectNodeContents(this.el.nativeElement);
      preSelectionRange.setEnd(range.startContainer, range.startOffset);
      this.selectionStart = [...preSelectionRange.toString()].length;
      this.selectionEnd = this.selectionStart + [...range.toString()].length;
    } else {
      this.selectionStart = undefined;
      this.selectionEnd = undefined;
    }

    if (this.selectionStart === undefined || this.selectionEnd === undefined || this.selectionStart >= this.selectionEnd) {
      console.log()
      return;
    }

    let startIndex= this.selectionStart
    let endIndex= this.selectionEnd

    this.annotation.layer = this.selectedLayer
    this.annotation.layerName = this.layerOptions.find(l => l.value == this.selectedLayer)?.label
    this.annotation.spans = new Array<SpanCoordinates>();
    this.annotation.spans.push({

    })

    console.log(startIndex, endIndex, selection, selection?.getRangeAt(0))
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
