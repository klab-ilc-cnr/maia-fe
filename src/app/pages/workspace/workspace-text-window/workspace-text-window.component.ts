import { LoaderService } from 'src/app/services/loader.service';
import { AnnotationService } from 'src/app/services/annotation.service';
import { SpanCoordinates } from './../../../model/annotation/span-coordinates';
import { Annotation } from './../../../model/annotation/annotation';
import { WorkspaceService } from 'src/app/services/workspace.service';
import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { TextRow } from 'src/app/model/text/text-row';
import { MessageService, SelectItem } from 'primeng/api';
import { LayerService } from 'src/app/services/layer.service';
import { Layer } from 'src/app/model/layer/layer.model';
import { TextLine } from 'src/app/model/text/text-line';
import { forkJoin } from 'rxjs';
import { TextHighlight } from 'src/app/model/text/text-highlight';
import { MessageConfigurationService } from 'src/app/services/message-configuration.service';

@Component({
  selector: 'app-workspace-text-window',
  templateUrl: './workspace-text-window.component.html',
  styleUrls: ['./workspace-text-window.component.scss']
})
export class WorkspaceTextWindowComponent implements OnInit {
  @Input()
  get visibleLayers(): Layer[] { return this._visibleLayers; }
  set visibleLayers(visibleLayers: Layer[]) {
    console.info('cambio layers', this.textId, this)
    this._visibleLayers = visibleLayers;
    this.loadData();
  }
  private _visibleLayers: Layer[] = [];

  private selectionStart?: number;
  private selectionEnd?: number;
  private _editIsLocked: boolean = false;
  private visualConfig = {
    spaceBeforeTextLine: 8,
    spaceAfterTextLine: 8,
    stdTextLineHeight: 16,
    stdTextOffsetX: 37,
    spaceBeforeVerticalLine: 2,
    spaceAfterVerticalLine: 2,
    textFont: "13px monospace",
    jsPanelHeaderBarHeight: 29.5,
    layerSelectHeightAndMargin: 37.75 + 26,
    paddingAfterTextEditor: 10,
    annotationHeight: 12,
    curlyHeight: 4,
    annotationFont: "10px 'PT Sans Caption'"
  }

  annotation = new Annotation();
  textRes: any;
  annotationsRes: any;
  simplifiedAnns: any;
  height: number = window.innerHeight / 2;
  layerOptions = new Array<SelectItem>();
  layersList: Layer[] = [];
  rows: TextRow[] = [];
  selectedLayer: any;
  sentnumVerticalLine: string = "M 0 0";
  svgHeight: number = 0;
  textContainerHeight: number = window.innerHeight / 2;
  textId: number | undefined;

  @ViewChild('svg') public svg!: ElementRef;

  constructor(
    private annotationService: AnnotationService,
    private loaderService: LoaderService,
    private workspaceService: WorkspaceService,
    private layerService: LayerService,
    private messageService: MessageService,
    private msgConfService: MessageConfigurationService
  ) { }

  ngOnInit(): void {
    if (!this.textId) {
      return;
    }

    this.updateHeight(this.height)

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

    this.loadData()

    // this.annotationService.retrieveText(this.textId).subscribe(data => {
    //   this.data = data;
    //   this.renderData();
    // })
  }

  loadData() {
    if (!this.textId) {
      return;
    }

    this.annotation = new Annotation();

    this.loaderService.show();

    forkJoin([
      this.layerService.retrieveLayers(),
      this.annotationService.retrieveText(this.textId),
      this.annotationService.retrieveByNodeId(this.textId)
    ]).subscribe({
      next: ([layersResponse, textResponse, annotationsResponse]) => {
        this.layersList = layersResponse;
        this.layerOptions = layersResponse.map(item => ({ label: item.name, value: item.id }));

        this.layerOptions.sort((a, b) => (a.label && b.label && a.label.toLowerCase() > b.label.toLowerCase()) ? 1 : -1);

        this.layerOptions.unshift({
          label: "Nessuna annotazione",
          value: -1
        });

        if (!this.selectedLayer) {
          this.selectedLayer = -1;
        }

        this.annotation.layer = this.selectedLayer;
        this.annotation.layerName = this.layerOptions.find(l => l.value == this.selectedLayer)?.label;

        this.textRes = textResponse;
        this.annotationsRes = annotationsResponse;

        this.simplifiedAnns = [];

        let layersIndex = new Array<string>();

        this.visibleLayers.forEach(l => {
          if (l.id) {
            layersIndex.push(l.id?.toString())
          }
        })

        this.annotationsRes.annotations.forEach((a: Annotation) => {
          if (a.spans && layersIndex.includes(a.layer)) {
            let x = a.spans.map((sc: SpanCoordinates) => {
              let {spans, ...newAnn} = a;
              return {
                ...newAnn,
                span: sc
              }
            })

            this.simplifiedAnns.push(...x)
          }
        })

        this.simplifiedAnns.sort((a: any, b: any) => a.span.start < b.span.start)

        console.log('Hello', this.simplifiedAnns)

        this.renderData();
        this.loaderService.hide();
      }
    });
  }

  onAnnotationCancel() {
    this.annotation = new Annotation();
  }

  onAnnotationDeleted() {
    this.annotation = new Annotation();
    this.loadData();
  }

  onAnnotationSaved() {
    this.annotation = new Annotation();
    this.loadData();
  }

  onChangeLayerSelection(event: any) {
    console.log('hello', this.selectedLayer, event)
  }

  onSelectionChange(event: any): void {
    console.log("stai selezionando", event)

    const selection = this.getCurrentTextSelection();

    if (!selection) {
      return;
    }

    this.annotation = new Annotation();

    let startIndex = selection.startIndex
    let endIndex = selection.endIndex
    let text = this.textRes.text.substring(startIndex, endIndex);

    this.annotation.layer = this.selectedLayer
    this.annotation.layerName = this.layerOptions.find(l => l.value == this.selectedLayer)?.label
    this.annotation.spans = new Array<SpanCoordinates>();
    this.annotation.spans.push({
      start: startIndex,
      end: endIndex
    })

    this.annotation.value = text;

    console.log(startIndex, endIndex, text)
  }

  openAnnotation(id: number) {
    if (!id) {
      this.messageService.add(this.msgConfService.generateErrorMessageConfig('Impossibile visualizzare l\'annotazione selezionata'));
      return;
    }

    let ann = this.annotationsRes.annotations.find((a: any) => a.id == id)

    if (!ann) {
      this.messageService.add(this.msgConfService.generateErrorMessageConfig('Annotazione non trovata'));
      return;
    }

    // if (this._editIsLocked) {

    // }

    this.annotation = {...ann}
    this.annotation.layerName = this.layerOptions.find(l => l.value == Number.parseInt(ann.layer))?.label;

    //this._editIsLocked = true;
  }

  updateComponentSize(newHeight: any) {
    this.updateHeight(newHeight);
    this.updateTextEditorSize();
  }

  updateHeight(newHeight: any) {
    console.log(this.height, newHeight)

    this.height = newHeight - Math.ceil(this.visualConfig.jsPanelHeaderBarHeight);
    this.textContainerHeight = this.height - Math.ceil(this.visualConfig.layerSelectHeightAndMargin + this.visualConfig.paddingAfterTextEditor);

    console.log(this.height, this.textContainerHeight);
  }

  updateTextEditorSize() {
    this.renderData();
  }

  private getComputedTextLength(text: string, font: string) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) {
      return text.length;
    }

    context.font = font || getComputedStyle(document.body).font;

    return context.measureText(text).width;
  }

  private getCurrentTextSelection() {
    const selection = window.getSelection();

    if (selection != null && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const preSelectionRange = range.cloneRange();
      preSelectionRange.selectNodeContents(this.svg.nativeElement);
      preSelectionRange.setEnd(range.startContainer, range.startOffset);
      this.selectionStart = [...preSelectionRange.toString()].length;
      this.selectionEnd = this.selectionStart + [...range.toString()].length;
    } else {
      this.selectionStart = undefined;
      this.selectionEnd = undefined;
    }

    if (this.selectionStart === undefined || this.selectionEnd === undefined || this.selectionStart >= this.selectionEnd) {
      return undefined;
    }

    return {
      startIndex: this.selectionStart,
      endIndex: this.selectionEnd,
    };
  }

  private createLine() {

  }

  private renderAnnotationsForLine(startIndex: number, endIndex: number) {
    let lineAnns = new Array();
    let lineHighlights = new Array<TextHighlight>();

    let localAnns = this.simplifiedAnns.filter((a: any) => (a.span.start >= (startIndex || 0) && a.span.end <= (endIndex || 0)));
    localAnns.sort((a: any, b: any) => (a.span.end - a.span.start) - (b.span.end - b.span.start));

    localAnns.forEach((ann: any) => {
      console.log('annotations', ann, this.layersList)
      let layer = this.layersList.find(l => l.id == Number.parseInt(ann.layer));
      let startX = this.getComputedTextLength(this.randomString(ann.span.start - (startIndex || 0)), this.visualConfig.textFont) + this.visualConfig.stdTextOffsetX;
      let text = layer?.id as unknown as string || ""; //layer?.name || ""; // il testo dell'annotazione dovrebbe essere le sue features separate dal carattere '|' ?
      let textAnnLenght = this.getComputedTextLength(text, this.visualConfig.annotationFont);
      let w = this.getComputedTextLength(this.randomString(ann.span.end - ann.span.start), this.visualConfig.textFont);
      let endX = startX + w;
      console.log(w, startX + (w/2) - (textAnnLenght/2), this.randomString(ann.span.end - ann.span.start))
      lineAnns.push({
        color: '#000',
        bgColor: layer?.color,
        text: layer?.id,
        textCoordinates: {
          x: Math.ceil(startX + w/2 - textAnnLenght/2),
          y: 0
        },
        startX: startX,
        width: w + 'px',
        endX: endX,
        height: this.visualConfig.annotationHeight,
        id: ann.id
      })

      lineHighlights.push({
        bgColor: layer?.color,
        coordinates: {
          x: startX - 1,
          y: 0
        },
        height: this.visualConfig.stdTextLineHeight - 2,
        width: w + 2
      })
    })

    return {
      lineAnns: lineAnns,
      lineHighLights: lineHighlights
    };
  }

  private renderData() {
    this.rows = [];

    let rawText = JSON.parse(JSON.stringify(this.textRes.text));
    let rawAnns = JSON.parse(JSON.stringify(this.annotationsRes.annotations));
    let sentences = rawText.split(/(?<=[\.!\?])/g);
    let row_id = 0;
    let start = 0;
    let end = rawText.length;

    console.log(this.svg, this.svg.nativeElement.clientWidth, this.svg.nativeElement.offsetWidth)
    let width = this.svg.nativeElement.clientWidth - 20 - this.visualConfig.stdTextOffsetX;

    let textFont = getComputedStyle(document.documentElement).getPropertyValue('--text-font-size') + " " + getComputedStyle(document.documentElement).getPropertyValue('--text-font-family');
    this.visualConfig.textFont = textFont;

    let annFont = getComputedStyle(document.documentElement).getPropertyValue('--annotation-font-size') + " " + getComputedStyle(document.documentElement).getPropertyValue('--annotations-font-family')
    this.visualConfig.annotationFont = annFont;

    let linesCounter = 0;
    let yStartRow = 0;
    let yStartLine = 0;
    //console.log(this.getComputedTextLength(sentences[0]))
    sentences.forEach((s: any, index: number) => {
      let sWidth = this.getComputedTextLength(s, this.visualConfig.textFont);

      let sLines = new Array<TextLine>();

      let words = s.split(/(?<=\s)/g);
      let stdLineHeight = this.visualConfig.spaceBeforeTextLine + this.visualConfig.spaceAfterTextLine + this.visualConfig.stdTextLineHeight;
      let startLine = start;
      //console.log(index, sWidth, " / ", width, " = ", sWidth/width, sWidth/width>1)
      if (sWidth/width > 1) {
        let wordAddedCounter = 0;
        let line = new TextLine();
        let lineWidth = 0;
        line.text = "";

        words.forEach((w: any) => {
          let wordWidth = this.getComputedTextLength(w, this.visualConfig.textFont);
          //console.log(index, w, wordWidth)
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

            let res = this.renderAnnotationsForLine(line.startIndex, line.endIndex);
            let lineAnns = res.lineAnns;
            let lineHighlights = res.lineHighLights;

            if (lineAnns.length > 0) {
              line.height = stdLineHeight + this.visualConfig.annotationHeight + this.visualConfig.curlyHeight + 1;
            }
            else {
              line.height = stdLineHeight;
            }

            yStartLine += line.height;
            line.yText = yStartLine - this.visualConfig.spaceAfterTextLine;
            line.yAnnotation = line.yText - this.visualConfig.stdTextLineHeight - this.visualConfig.spaceBeforeTextLine - 1;

            lineAnns.forEach((ann) => {
              ann.y = (line.yAnnotation || 0) - this.visualConfig.curlyHeight - 1;
              ann.textCoordinates.y = ann.y + ann.height - 2;
              ann.curlyPath = this.generateCurlyPath(ann)
            })

            line.annotations = lineAnns;

            line.yHighlight = line.yText - this.visualConfig.stdTextLineHeight + 5;

            lineHighlights.forEach((h) => {
              h.coordinates.y = (line.yHighlight || 0);
            })

            line.highlights = lineHighlights;

            sLines.push(JSON.parse(JSON.stringify(line)));

            startLine += (line.text?.length || 0);
            linesCounter++;

            if (wordAddedCounter != words.length) {
              line.text = "";
              lineWidth = 0;
              line.words = [];
              line.annotations = [];

              line.text += w;
              wordAddedCounter++;
              lineWidth += wordWidth;
              line.words.push(w);
            }
          }

          if (wordAddedCounter == words.length) {
            line.startIndex = startLine;
            line.endIndex = startLine + (line.text?.length || 0);

            let res = this.renderAnnotationsForLine(line.startIndex, line.endIndex);
            let lineAnns = res.lineAnns;
            let lineHighlights = res.lineHighLights;

            if (lineAnns.length > 0) {
              line.height = stdLineHeight + this.visualConfig.annotationHeight + this.visualConfig.curlyHeight + 1;
            }
            else {
              line.height = stdLineHeight;
            }

            yStartLine += line.height;
            line.yText = yStartLine - this.visualConfig.spaceAfterTextLine;
            line.yAnnotation = line.yText - this.visualConfig.stdTextLineHeight - this.visualConfig.spaceBeforeTextLine - 1;

            lineAnns.forEach((ann) => {
              ann.y = (line.yAnnotation || 0) - this.visualConfig.curlyHeight - 1;
              ann.textCoordinates.y = ann.y + ann.height - 2;
              ann.curlyPath = this.generateCurlyPath(ann)
            })

            line.annotations = lineAnns;

            line.yHighlight = line.yText - this.visualConfig.stdTextLineHeight + 5;

            lineHighlights.forEach((h) => {
              h.coordinates.y = (line.yHighlight || 0);
            })

            line.highlights = lineHighlights;

            sLines.push(JSON.parse(JSON.stringify(line)));

            startLine += (line.text?.length || 0);
            linesCounter++;
          }
        })
      }
      else {
        let res = this.renderAnnotationsForLine(startLine, startLine + s.length);
        let lineAnns = res.lineAnns;
        let lineHighlights = res.lineHighLights;

        let rHeight = 0;

        if (lineAnns.length > 0) {
          rHeight = stdLineHeight + this.visualConfig.annotationHeight + this.visualConfig.curlyHeight + 1;
        }
        else {
          rHeight = stdLineHeight;
        }

        yStartLine += rHeight;
        let yText = yStartLine - this.visualConfig.spaceAfterTextLine;
        let yAnnotation = yText - this.visualConfig.stdTextLineHeight - this.visualConfig.spaceBeforeTextLine - 1;

        lineAnns.forEach((ann) => {
          ann.y = (yAnnotation || 0) - this.visualConfig.curlyHeight - 1;
          ann.textCoordinates.y = ann.y + ann.height - 2;
          ann.curlyPath = this.generateCurlyPath(ann)
        })

        let yHighlight = yText - this.visualConfig.stdTextLineHeight + 5;

        lineHighlights.forEach((h) => {
          h.coordinates.y = (yHighlight || 0);
        })

        let line = {
          text: s,
          words: words,
          height: rHeight,
          yText: yText,
          startIndex: startLine,
          endIndex: startLine + s.length,
          annotations: lineAnns,
          yAnnotation: yAnnotation,
          highlights: lineHighlights,
          yHighlight: yHighlight
        }

        // yStartLine += line.height;
        // line.yText = yStartLine - this.visualConfig.spaceAfterTextLine;
        startLine += s.length;
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

    console.log(this.rows, start)

    this.svgHeight = this.rows.reduce((acc, o) => acc + (o.height || 0), 0);

    this.sentnumVerticalLine = "M 34 0 L 34 " + this.svgHeight;
  }

  private generateCurlyPath(ann: any): any {
    console.log("stampo", ann)
    let y = (ann.y + this.visualConfig.annotationHeight + 2)
    let move = "M " + ann.startX + " " + (y + this.visualConfig.curlyHeight) + " ";
    let x = ann.startX + (ann.endX - ann.startX)/2
    let curve1 = "C " + ann.startX + " " + y + ", " + x + " " + (y + this.visualConfig.curlyHeight) + ", " + x + " " + y
    let curve2 = "C " + x + " " + (y + this.visualConfig.curlyHeight) + ", " + ann.endX + " " + y + ", " + ann.endX + " " + (y + this.visualConfig.curlyHeight)

    //a + b + ',' + c + (d == null ? '' : ' ' + d + ',' + e + (f == null ? '' : ' ' + f + ',' + g))

    return move + curve1 + " " + curve2;
  }

  private randomString(length: number) {
    var text = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (var i = 0; i < length; i++) {
      text += possible[Math.floor(Math.random() * possible.length)];
    }
    return text;
  }
}
