import { LineBuilder } from 'src/app/models/text/line-builder';
import { LoaderService } from 'src/app/services/loader.service';
import { AnnotationService } from 'src/app/services/annotation.service';
import { SpanCoordinates } from 'src/app/models/annotation/span-coordinates';
import { Annotation } from 'src/app/models/annotation/annotation';
import { WorkspaceService } from 'src/app/services/workspace.service';
import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { TextRow } from 'src/app/models/text/text-row';
import { MessageService, SelectItem } from 'primeng/api';
import { LayerService } from 'src/app/services/layer.service';
import { Layer } from 'src/app/models/layer/layer.model';
import { TextLine } from 'src/app/models/text/text-line';
import { forkJoin } from 'rxjs';
import { TextHighlight } from 'src/app/models/text/text-highlight';
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
    stdSentnumOffsetX: 32,
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

    this.updateHeight(this.height);

    this.loadData();
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

            this.simplifiedAnns.push(...x);
          }
        })

        this.simplifiedAnns.sort((a: any, b: any) => a.span.start < b.span.start);

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
    // console.log("stai selezionando", event)

    const selection = this.getCurrentTextSelection();

    if (!selection) {
      return;
    }

    this.annotation = new Annotation();

    let startIndex = selection.startIndex;
    let endIndex = selection.endIndex;
    let text = this.textRes.text.substring(startIndex, endIndex);

    this.annotation.layer = this.selectedLayer;
    this.annotation.layerName = this.layerOptions.find(l => l.value == this.selectedLayer)?.label;
    this.annotation.spans = new Array<SpanCoordinates>();
    this.annotation.spans.push({
      start: startIndex,
      end: endIndex
    })

    this.annotation.value = text;

    // console.log(startIndex, endIndex, text)
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
    // console.log(this.height, newHeight)

    this.height = newHeight - Math.ceil(this.visualConfig.jsPanelHeaderBarHeight);
    this.textContainerHeight = this.height - Math.ceil(this.visualConfig.layerSelectHeightAndMargin + this.visualConfig.paddingAfterTextEditor);

    // console.log(this.height, this.textContainerHeight);
  }

  updateTextEditorSize() {
    this.renderData();
  }

  private createLine(auxLineBuilder: any) {
    let startIndex = auxLineBuilder.startLine;
    let endIndex = auxLineBuilder.startLine + auxLineBuilder.line.text.length;

    let res = this.renderAnnotationsForLine(startIndex, endIndex);
    let lineTowers = res.lineTowers;
    let lineHighlights = res.lineHighLights;

    let lineHeight = this.getStdLineHeight();

    if (lineTowers.length > 0) {
      let towerH = this.getMaxTowerPosition(lineTowers)
      lineHeight = this.getStdLineHeight() + towerH + this.visualConfig.curlyHeight + 1;
    }

    let yStartLine = auxLineBuilder.yStartLine + lineHeight;
    let yText = yStartLine - this.visualConfig.spaceAfterTextLine;
    let yAnnotation = yText - this.visualConfig.stdTextLineHeight - this.visualConfig.spaceBeforeTextLine - 1;

    let annsHeightsAdder: number = 0;

    lineTowers.forEach((t) => {
      annsHeightsAdder = 0;
      t.tower.forEach((ann: any) => {
        ann.y = yAnnotation - this.visualConfig.curlyHeight - 1 - annsHeightsAdder - t.yAnnotationOffset;
        ann.textCoordinates.y = ann.y + ann.height - 2;
        annsHeightsAdder += this.visualConfig.annotationHeight;
      })

      if (t.tower.length != 0) {
        t.curlyPath = this.generateCurlyPath(t.tower[0])
      }
    })

    let yHighlight = yText - this.visualConfig.stdTextLineHeight + 5;

    lineHighlights.forEach((h) => {
      h.coordinates.y = yHighlight;
    })

    let line = {
      text: auxLineBuilder.line.text,
      words: auxLineBuilder.line.words,
      height: lineHeight,
      yText: yText,
      x: this.visualConfig.stdTextOffsetX,
      startIndex: auxLineBuilder.startLine,
      endIndex: auxLineBuilder.startLine + auxLineBuilder.line.text.length,
      annotationsTowers: lineTowers,
      yAnnotation: yAnnotation,
      highlights: lineHighlights,
      yHighlight: yHighlight
    }

    return line;
  }

  private elaborateTextLabel(layer: Layer | undefined, annotation: any) {
    return layer?.id as unknown as string || ""; //layer?.name || ""; // il testo dell'annotazione dovrebbe essere le sue features separate dal carattere '|' ?
  }

  private generateCurlyPath(ann: any): string {
    let y = (ann.y + this.visualConfig.annotationHeight + 2)
    let move = "M " + ann.startX + " " + (y + this.visualConfig.curlyHeight) ;
    let x = ann.startX + (ann.endX - ann.startX)/2
    let curve1 = "C " + ann.startX + " " + y + ", " + x + " " + (y + this.visualConfig.curlyHeight) + ", " + x + " " + y
    let curve2 = "C " + x + " " + (y + this.visualConfig.curlyHeight) + ", " + ann.endX + " " + y + ", " + ann.endX + " " + (y + this.visualConfig.curlyHeight)

    return move + " " + curve1 + " " + curve2;
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

  private getMaxTowerPosition(array: any[]) {
    return Math.max(...array.map(o => (o.towerHeight + o.yAnnotationOffset)))
  }

  private getStdLineHeight() {
    return this.visualConfig.spaceBeforeTextLine + this.visualConfig.spaceAfterTextLine + this.visualConfig.stdTextLineHeight;
  }

  private randomString(length: number) {
    var text = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (var i = 0; i < length; i++) {
      text += possible[Math.floor(Math.random() * possible.length)];
    }
    return text;
  }

  private renderAnnotationsForLine(startIndex: number, endIndex: number) {
    let lineTowers = new Array();
    let lineHighlights = new Array<TextHighlight>();

    let localAnns = this.simplifiedAnns.filter((a: any) => (a.span.start >= (startIndex || 0) && a.span.end <= (endIndex || 0)));
    localAnns.sort((a: any, b: any) => (a.span.end - a.span.start) - (b.span.end - b.span.start));

    let towers = this.sortFragmentsIntoTowers(localAnns);

    towers.forEach((t: any) => {
      let annTower = new Array();

      t.anns.forEach((ann: any) => {
        let layer = this.layersList.find(l => l.id == Number.parseInt(ann.layer));
        let startX = this.getComputedTextLength(this.randomString(t.span.start - (startIndex || 0)), this.visualConfig.textFont) + this.visualConfig.stdTextOffsetX;
        let text = this.elaborateTextLabel(layer, ann);
        let textAnnLenght = this.getComputedTextLength(text, this.visualConfig.annotationFont);
        let w = this.getComputedTextLength(this.randomString(t.span.end - t.span.start), this.visualConfig.textFont);
        let endX = startX + w;

        // console.log(w, startX + (w/2) - (textAnnLenght/2), this.randomString(t.span.end - t.span.start))

        annTower.push({
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

      let minorTowers = lineTowers.filter((lt) => (lt.spanCoordinates.start >= t.span.start && lt.spanCoordinates.end <= t.span.end) || (lt.spanCoordinates.start < t.span.start && lt.spanCoordinates.end > t.span.start) || (lt.spanCoordinates.start < t.span.end && lt.spanCoordinates.end > t.span.end));

      let yOffset = 0;

      yOffset = minorTowers.reduce((acc: any, o: any) => acc + o.towerHeight, 0);

      let minorTowersGroupedByYannotationOffset = minorTowers.reduce((a, { yAnnotationOffset,...rest }) => {
        const key = `${yAnnotationOffset}`;
        a[key] = a[key] || { yAnnotationOffset, towers: [] };
        a[key]["towers"].push(rest)
        return a;
      }, {});

      let towersGroups = [];
      towersGroups = Object.values(minorTowersGroupedByYannotationOffset);

      if (towersGroups.length > 0) {
        let maxGroup: any = towersGroups.reduce((max: any, tGroup: any) => max.yAnnotationOffset > tGroup.yAnnotationOffset ? max : tGroup);
        let higherTowersGroupHeight = Math.max(...maxGroup.towers.map((o: any) => (o.towerHeight)))

        yOffset = maxGroup.yAnnotationOffset + higherTowersGroupHeight;
        yOffset += (this.visualConfig.curlyHeight + 3);
      }

      lineTowers.push({
        spanCoordinates: t.span,
        tower: annTower,
        towerHeight: annTower.length * this.visualConfig.annotationHeight,
        yAnnotationOffset: yOffset
      })
    })

    return {
      lineTowers: lineTowers,
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

    // console.log(this.svg, this.svg.nativeElement.clientWidth, this.svg.nativeElement.offsetWidth)
    let width = this.svg.nativeElement.clientWidth - 20 - this.visualConfig.stdTextOffsetX;

    let textFont = getComputedStyle(document.documentElement).getPropertyValue('--text-font-size') + " " + getComputedStyle(document.documentElement).getPropertyValue('--text-font-family');
    this.visualConfig.textFont = textFont;

    let annFont = getComputedStyle(document.documentElement).getPropertyValue('--annotation-font-size') + " " + getComputedStyle(document.documentElement).getPropertyValue('--annotations-font-family')
    this.visualConfig.annotationFont = annFont;

    let linesCounter = 0;
    let yStartRow = 0;
    let lineBuilder = new LineBuilder;

    lineBuilder.yStartLine = 0;

    sentences.forEach((s: any, index: number) => {
      let sWidth = this.getComputedTextLength(s, this.visualConfig.textFont);

      let sLines = new Array<TextLine>();

      let words = s.split(/(?<=\s)/g);

      lineBuilder.startLine = start;

      if (sWidth/width > 1) {
        let wordAddedCounter = 0;
        lineBuilder.line = new TextLine();
        let lineWidth = 0;
        lineBuilder.line.text = "";

        words.forEach((w: any) => {
          let wordWidth = this.getComputedTextLength(w, this.visualConfig.textFont);

          if ((lineWidth + wordWidth) <= width) {
            lineBuilder.line.text += w;
            wordAddedCounter++;
            lineWidth += wordWidth;

            if (!lineBuilder.line.words) {
              lineBuilder.line.words = [];
            }

            lineBuilder.line.words.push(w);
          }
          else {
            let line = this.createLine(lineBuilder);
            lineBuilder.yStartLine += line.height;

            sLines.push(JSON.parse(JSON.stringify(line)));

            lineBuilder.startLine += (line.text?.length || 0);
            linesCounter++;

            if (wordAddedCounter != words.length) {
              lineBuilder.line.text = "";
              lineWidth = 0;
              lineBuilder.line.words = [];
              lineBuilder.line.annotationsTowers = [];

              lineBuilder.line.text += w;
              wordAddedCounter++;
              lineWidth += wordWidth;
              lineBuilder.line.words.push(w);
            }
          }

          if (wordAddedCounter == words.length) {
            let line = this.createLine(lineBuilder);
            lineBuilder.yStartLine += line.height;

            sLines.push(JSON.parse(JSON.stringify(line)));

            lineBuilder.startLine += (line.text?.length || 0);
            linesCounter++;
          }
        })
      }
      else {
        lineBuilder.line = new TextLine();
        lineBuilder.line.text = s;
        lineBuilder.line.words = words;

        let line = this.createLine(lineBuilder);
        lineBuilder.yStartLine += line.height;

        sLines.push(JSON.parse(JSON.stringify(line)));

        lineBuilder.startLine += (line.text?.length || 0);
        linesCounter++;
      }

      let sLinesCopy = JSON.parse(JSON.stringify(sLines));

      let rowHeight = sLinesCopy.reduce((acc: any, o: any) => acc + o.height, 0);

      this.rows?.push({
        id: row_id + 1,
        height: rowHeight,
        lines: sLinesCopy,
        yBG:  yStartRow,
        xText: this.visualConfig.stdTextOffsetX,
        yText: sLinesCopy[0].yText - this.visualConfig.spaceAfterTextLine,
        xSentnum: this.visualConfig.stdSentnumOffsetX,
        ySentnum: sLinesCopy[sLinesCopy.length - 1].yText,
        text: s,
        words: words,
        startIndex: start,
        endIndex: start + s.length,
      })

      yStartRow += rowHeight;
      start += s.length;
    })

    // console.log(this.rows, start)

    this.svgHeight = this.rows.reduce((acc, o) => acc + (o.height || 0), 0);

    this.sentnumVerticalLine = "M 34 0 L 34 " + this.svgHeight;
  }

  private sortFragmentsIntoTowers(annotations: any[]) {
    let towers = annotations.reduce((a, { span,...rest }) => {
      const key = `${span.start}-${span.end}`;
      a[key] = a[key] || { span, anns: [] };
      a[key]["anns"].push(rest)
      return a;
    }, {});

    return Object.values(towers);
  }
}
