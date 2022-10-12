import { EditorType } from 'src/app/models/editor-type';
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
import { v4 as uuidv4 } from 'uuid';
import { Relation } from 'src/app/models/relation/relation';
import { Relations } from 'src/app/models/relation/relations';
import { AnnotationMetadata } from 'src/app/models/annotation/annotation-metadata';

@Component({
  selector: 'app-workspace-text-window',
  templateUrl: './workspace-text-window.component.html',
  styleUrls: ['./workspace-text-window.component.scss']
})
export class WorkspaceTextWindowComponent implements OnInit {

  private selectionStart?: number;
  private selectionEnd?: number;
  private _editIsLocked: boolean = false;
  private visualConfig = {
    draggedArcHeight: 30,
    spaceBeforeTextLine: 8,
    spaceAfterTextLine: 8,
    stdTextLineHeight: 18,
    stdTextOffsetX: 37,
    stdSentnumOffsetX: 32,
    spaceBeforeVerticalLine: 2,
    spaceAfterVerticalLine: 2,
    textFont: "13px monospace",
    jsPanelHeaderBarHeight: 29.5,
    layerSelectHeightAndMargin: 69.75 + 16,
    paddingAfterTextEditor: 10,
    annotationHeight: 12,
    curlyHeight: 4,
    annotationFont: "10px 'PT Sans Caption'",
    arcFont: "10px 'PT Sans Caption'",
    labelMaxLenght: 10,
    labelPaddingXAxis: 3,
    arcAngleOffset: 3,
    arcSpacing: 10,
    arcCircleLabelPlaceholderHeight: 7,
    arcCircleLabelPlaceholderWidth: 7
  }

  annotation = new Annotation();
  annotationsRes: any;
  dragArrow: any = {
    m: "",
    c: "",
    isDrawing: false,
    visibility: "hidden",
    sourceAnn: new Annotation(),
    targetAnn: new Annotation()
  };
  height: number = window.innerHeight / 2;
  layerOptions = new Array<SelectItem>();
  layersList: Layer[] = [];
  relation = new Relation();
  rows: TextRow[] = [];
  selectedLayer: any;
  selectedLayers: Layer[] | undefined;
  sentnumVerticalLine: string = "M 0 0";
  showAnnotationEditor: boolean = false;
  showRelationEditor: boolean = false;
  simplifiedAnns: any;
  simplifiedArcs: Array<Relation> = [];
  sourceAnn = new Annotation();
  sourceLayer = new Layer();
  svgHeight: number = 0;
  targetAnn =  new Annotation();
  targetLayer =  new Layer();
  textContainerHeight: number = window.innerHeight / 2;
  textId: number | undefined;
  textRes: any;
  visibleLayers: Layer[] = [];

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

    this.showAnnotationEditor = true;

    this.updateHeight(this.height);

    this.loadData();
  }

  changeVisibleLayers(event: any) {
    this.visibleLayers = this.selectedLayers || [];
    this.loadData();
  }

  loadData() {
    if (!this.textId) {
      return;
    }

    this.annotation = new Annotation();
    this.relation = new Relation();

    this.loaderService.show();

    forkJoin([
      this.layerService.retrieveLayers(),
      this.annotationService.retrieveText(this.textId),
      this.annotationService.retrieveByNodeId(this.textId)
    ]).subscribe({
      next: ([layersResponse, textResponse, annotationsResponse]) => {
        this.layersList = layersResponse;

        if (!this.selectedLayers) {
          this.visibleLayers = this.selectedLayers = this.layersList;
        }
        else {
          this.visibleLayers = this.selectedLayers;
        }

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
        this.simplifiedArcs = [];

        let layersIndex = new Array<string>();

        this.visibleLayers.forEach(l => {
          if (l.id) {
            layersIndex.push(l.id?.toString())
          }
        })

        this.annotationsRes.annotations.forEach((a: Annotation) => {
          if (a.spans && layersIndex.includes(a.layer)) {
            let sAnn = a.spans.map((sc: SpanCoordinates) => {
              let {spans, ...newAnn} = a;
              return {
                ...newAnn,
                span: sc
              }
            })

            this.simplifiedAnns.push(...sAnn);
          }

          if (a.attributes && a.attributes["relations"]) {
            let sArc = a.attributes["relations"].out.forEach((r: Relation) => {
              if(!this.simplifiedArcs.includes(r) && r.srcLayerId && layersIndex.includes(r.srcLayerId.toString()) && r.targetLayerId && layersIndex.includes(r.targetLayerId.toString())) {
                this.simplifiedArcs.push(r);
              }
            })
          }
        })

        this.simplifiedAnns.sort((a: any, b: any) => a.span.start < b.span.start);

        console.log('Hello', this.simplifiedAnns)
        console.log('Archi', this.simplifiedArcs)

        this.renderData();
        this.loaderService.hide();
      }
    });
  }

  mouseMoved(event: any) {
    if (this.dragArrow.isDrawing) {
      this.dragArrow.visibility = "visible";
      this.svg.nativeElement.classList.add('unselectable');

      let x1 = this.dragArrow.x1
      let y1 = Math.min(...[this.dragArrow.y1, event.offsetY]) - this.visualConfig.draggedArcHeight;
      let x2 = event.offsetX
      let y2 = y1

      this.dragArrow.c = "C " + x1 + " " + y1 + ", " + x2 + " " + y2 + ", " + event.offsetX + " " + event.offsetY
      return;
    }
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

  onRelationCancel() {
    this.relation = new Relation();
    this.annotation = new Annotation();
    this.showEditorAndHideOthers(EditorType.Annotation);
  }

  onRelationDeleted() {
    this.relation = new Relation();
    this.showEditorAndHideOthers(EditorType.Annotation);
    this.loadData();
  }

  onRelationSaved() {
    this.relation = new Relation();
    this.showEditorAndHideOthers(EditorType.Annotation);
    this.loadData();
  }

  onSelectionChange(event: any): void {
    const selection = this.getCurrentTextSelection();

    if (!selection) {
      return;
    }

    this.annotation = new Annotation();

    let startIndex = selection.startIndex;
    let endIndex = selection.endIndex;
    let text = this.textRes.text.substring(startIndex, endIndex);

    if (!this.onlySpaces(text)) {
      let originalLength = text.length;
      let newText = text.trimStart();
      let newLength = newText.length;

      startIndex = startIndex + (originalLength - newLength);

      newText = text.trimEnd();
      newLength = newText.length;

      endIndex = endIndex - (originalLength - newLength);
    }

    let relations = new Relations();

    this.annotation.layer = this.selectedLayer;
    this.annotation.layerName = this.layerOptions.find(l => l.value == this.selectedLayer)?.label;
    this.annotation.spans = new Array<SpanCoordinates>();
    this.annotation.spans.push({
      start: startIndex,
      end: endIndex
    })

    this.annotation.attributes = {};
    this.annotation.attributes["relations"] = relations;
    this.annotation.attributes["metadata"] = new AnnotationMetadata();

    this.annotation.value = text;

    this.showEditorAndHideOthers(EditorType.Annotation);
  }

  openAnnotation(id: number) {
    if (this.dragArrow.isDrawing) {
      return;
    }

    if (!id) {
      this.messageService.add(this.msgConfService.generateErrorMessageConfig('Impossibile visualizzare l\'annotazione selezionata'));
      return;
    }

    this.showEditorAndHideOthers(EditorType.Annotation);

    let ann = this.annotationsRes.annotations.find((a: any) => a.id == id);

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

  openRelation(id: string) {
    if (this.dragArrow.isDrawing) {
      return;
    }

    if (!id) {
      this.messageService.add(this.msgConfService.generateErrorMessageConfig('Impossibile visualizzare la relazione selezionata'));
      return;
    }

    let rel = this.simplifiedArcs.find((a: any) => a.id == id)

    if (!rel) {
      this.messageService.add(this.msgConfService.generateErrorMessageConfig('Relazione non trovata'));
      return;
    }

    this.relation = {...rel};
    this.sourceAnn = this.annotationsRes.annotations.find((a: any) => a.id == rel?.srcAnnId);
    this.targetAnn = this.annotationsRes.annotations.find((a: any) => a.id == rel?.targetAnnId);

    let sLayer = this.layersList.find(l => l.id == Number.parseInt(this.sourceAnn.layer));
    let tLayer = this.layersList.find(l => l.id == Number.parseInt(this.targetAnn.layer));

    if (!sLayer || !tLayer) {
      this.messageService.add(this.msgConfService.generateErrorMessageConfig('Impossibile visualizzare la relazione selezionata'));
      return;
    }

    this.sourceLayer = sLayer;
    this.targetLayer = tLayer;

    this.showEditorAndHideOthers(EditorType.Relation);
  }

  overEnterRelation(id: string) {
    $('*[data-relation-id="' + id + '"]').addClass("filtered");

    let arc = this.simplifiedArcs.find(ar => ar.id == id);

    if (!arc || !arc.srcAnnId || !arc.targetAnnId) {
      return;
    }

    $('#' + arc.srcAnnId + '').addClass("filtered");
    $('#' + arc.targetAnnId + '').addClass("filtered");
    $('#' + this.generateHighlightId(arc.srcAnnId) + '').addClass("over");
    $('#' + this.generateHighlightId(arc.targetAnnId) + '').addClass("over");
  }

  overLeaveRelation(id: string) {
    $('*[data-relation-id="' + id + '"]').removeClass("filtered");

    let arc = this.simplifiedArcs.find(ar => ar.id == id);

    if (!arc || !arc.srcAnnId || !arc.targetAnnId) {
      return;
    }

    $('#' + arc.srcAnnId + '').removeClass("filtered");
    $('#' + arc.targetAnnId + '').removeClass("filtered");
    $('#' + this.generateHighlightId(arc.srcAnnId) + '').removeClass("over");
    $('#' + this.generateHighlightId(arc.targetAnnId) + '').removeClass("over");
  }

  startDrawing(event: any, annotation: any) {
    if (!annotation.id) {
      return;
    }

    let ann = this.annotationsRes.annotations.find((a: any) => a.id == annotation.id);

    if (!ann) {
      return;
    }

    this.dragArrow.sourceAnn = ann;
    this.dragArrow.isDrawing = true;
    this.dragArrow.m = "M " + (annotation.startX + (annotation.endX - annotation.startX)/2) + " " + annotation.y + ", "
    this.dragArrow.x1 = annotation.startX + annotation.width/2;
    this.dragArrow.y1 = annotation.y - this.visualConfig.draggedArcHeight;

    this.clearSelection();
  }

  endDrawing(event: any) {
    if (!this.dragArrow.isDrawing) {
      return;
    }

    this.dragArrow.isDrawing = false;
    this.dragArrow.visibility = "hidden";
    this.dragArrow.m = ""
    this.dragArrow.c = ""

    this.svg.nativeElement.classList.remove('unselectable');
    this.clearSelection();
  }

  endDrawingAndCreateRelation(event: any, annotation: Annotation) {
    if (!this.dragArrow.isDrawing) {
      return;
    }

    if (!annotation.id) {
      this.endDrawing(event)
      return;
    }

    let ann = this.annotationsRes.annotations.find((a: any) => a.id == annotation.id);

    if (!ann) {
      this.endDrawing(event)
      return;
    }

    this.dragArrow.targetAnn = ann;

    this.sourceAnn = JSON.parse(JSON.stringify(this.dragArrow.sourceAnn));
    this.targetAnn = JSON.parse(JSON.stringify(this.dragArrow.targetAnn));

    let sLayer = this.layersList.find(l => l.id == Number.parseInt(this.sourceAnn.layer));
    let tLayer = this.layersList.find(l => l.id == Number.parseInt(this.targetAnn.layer));

    if (!sLayer || !tLayer) {
      this.endDrawing(event)
      return;
    }

    this.sourceLayer = sLayer;
    this.targetLayer = tLayer;

    let relation = new Relation();

    relation.name = "Relation";
    relation.srcAnnId = this.dragArrow.sourceAnn.id;
    relation.srcLayerId = Number.parseInt(this.dragArrow.sourceAnn.layer);
    relation.targetAnnId = this.dragArrow.targetAnn.id;
    relation.targetLayerId = Number.parseInt(this.dragArrow.targetAnn.layer);

    this.relation = relation;

    this.showEditorAndHideOthers(EditorType.Relation);

    this.endDrawing(event)
  }

  updateComponentSize(newHeight: any) {
    this.updateHeight(newHeight);
    this.updateTextEditorSize();
  }

  updateHeight(newHeight: any) {
    this.height = newHeight - Math.ceil(this.visualConfig.jsPanelHeaderBarHeight);
    this.textContainerHeight = this.height - Math.ceil(this.visualConfig.layerSelectHeightAndMargin + this.visualConfig.paddingAfterTextEditor);
  }

  updateTextEditorSize() {
    this.renderData();
  }

  private clearSelection() {
    const selection = window.getSelection();

    if (selection != null) {
      selection.removeAllRanges();
    }
    // window.getSelection().removeAllRanges();
    // if (selRect != null) {
    //   for(var s=0; s != selRect.length; s++) {
    //     selRect[s].parentNode.removeChild(selRect[s]);
    //   }
    //   selRect = null;
    //   lastStartRec = null;
    //   lastEndRec = null;
    // }
  }

  private computeArcOffset(lineTowers: Array<any>, sourceSpanLimit: number, targetSpanLimit: number, lineArcs: Array<any>, startArcX: number, endArcX: number, arcType: string) {
    let spaceFactor = 1;
    if (arcType == "includedArc") {
      spaceFactor = 2;
    }

    let towerH = this.getMaxTowerAroundAnns(lineTowers, sourceSpanLimit, targetSpanLimit);
    let yBaseOffset = this.visualConfig.arcSpacing * spaceFactor;
    let yOffset = yBaseOffset;

    if (towerH > 0) {
      yOffset += towerH;
    }

    let maxRelationOffset = this.getMaxArcOffsetInRange(lineArcs, startArcX, endArcX);
    let adjustOffset = yOffset == yBaseOffset ? yOffset : 0;
    let newPossibleOffset = adjustOffset + maxRelationOffset + this.visualConfig.arcSpacing * 2/spaceFactor;

    if (maxRelationOffset >= 0 && newPossibleOffset > yOffset) {
      yOffset = newPossibleOffset;
    }

    return yOffset;
  }

  private computeStartAndEndXPosition(sourceSpanLimit: number, targetSpanLimit: number, startIndex: number) {
    const startArcX = this.getComputedTextLength(this.randomString(sourceSpanLimit - (startIndex || 0)), this.visualConfig.textFont) + this.visualConfig.stdTextOffsetX;
    const endArcX = this.getComputedTextLength(this.randomString(targetSpanLimit - (startIndex || 0)), this.visualConfig.textFont) + this.visualConfig.stdTextOffsetX;

    return {
      startArcX: startArcX,
      endArcX: endArcX
    }
  }

  private createLine(auxLineBuilder: any) {
    let startIndex = auxLineBuilder.startLine;
    let endIndex = auxLineBuilder.startLine + auxLineBuilder.line.text.length;

    let resAnns = this.renderAnnotationsForLine(startIndex, endIndex);
    let lineTowers = resAnns.lineTowers;
    let lineHighlights = resAnns.lineHighLights;

    let resArcs = this.renderArcsForLine(startIndex, endIndex, lineTowers);

    let lineHeight = this.getStdLineHeight();

    if (lineTowers.length > 0) {
      let towerH = this.getMaxTowerPosition(lineTowers)
      lineHeight = this.getStdLineHeight() + towerH + this.visualConfig.curlyHeight + 1;
    }

    let arcH = 0;

    if (resArcs.length > 0) {
      arcH = this.getMaxArcOffset(resArcs) + 2 + this.visualConfig.arcSpacing;
    }

    let newPossibleHeight = this.getStdLineHeight() + arcH;

    if (newPossibleHeight > lineHeight) {
      lineHeight = newPossibleHeight;
    }

    let yStartLine = auxLineBuilder.yStartLine + lineHeight;
    let yText = yStartLine - this.visualConfig.spaceAfterTextLine;
    let yAnnotation = yText - this.visualConfig.stdTextLineHeight - this.visualConfig.spaceBeforeTextLine - 1;

    lineTowers.forEach((t) => {
      t.tower.forEach((ann: any) => {
        ann.y = yAnnotation - this.visualConfig.curlyHeight - 1 - ann.yOffset - t.yTowerOffset;
        ann.textCoordinates.y = ann.y + ann.height - 2;
      })

      if (t.tower.length != 0) {
        t.curlyPath = this.generateCurlyPath(t.tower[0])
      }
    })

    resArcs.forEach((ar) => {
      let sAnn = this.findAnnotationInTowers(ar.relation.sourceAnn.id, lineTowers);
      let tAnn = this.findAnnotationInTowers(ar.relation.targetAnn.id, lineTowers);

      switch (ar.type) {
        case "includedArc": {
          ar.start.y = sAnn.y + this.visualConfig.annotationHeight/2;
          ar.end.y = tAnn.y + this.visualConfig.annotationHeight/2;

          let diffH = yAnnotation - Math.max(ar.start.y, ar.end.y)
          ar.yArcOffset = yAnnotation + diffH - ar.yArcOffset;

          break;
        }

        case "startedArc": {
          ar.start.y = sAnn.y + this.visualConfig.annotationHeight/2;
          ar.end.y = sAnn.y + this.visualConfig.annotationHeight/2;

          let diffH = yAnnotation - Math.max(ar.start.y, ar.end.y)
          ar.yArcOffset = yAnnotation + diffH - ar.yArcOffset;

          break;
        }

        case "endedArc": {
          ar.start.y = tAnn.y + this.visualConfig.annotationHeight/2;
          ar.end.y = tAnn.y + this.visualConfig.annotationHeight/2;

          let diffH = yAnnotation - Math.max(ar.start.y, ar.end.y)
          ar.yArcOffset = yAnnotation + diffH - ar.yArcOffset;

          break;
        }

        case "passingArc": {
          ar.yArcOffset = yAnnotation - ar.yArcOffset;
          ar.start.y = ar.yArcOffset;
          ar.end.y = ar.yArcOffset;
          break;
        }

        default: {
          break;
        }
      }

      let paths = this.generateArcPath(ar);

      ar.firstSegmentPath = paths.firstSegmentPath;
      ar.secondSegmentPath = paths.secondSegmentPath;

      if (ar.circleVisible) {
        ar.circleStartX = Math.min(ar.firstSegment.start, ar.secondSegment.end) + Math.abs(ar.firstSegment.start - ar.secondSegment.end)/2 - this.visualConfig.arcCircleLabelPlaceholderWidth/2;
        ar.circleStartY = ar.yArcOffset + ar.yAnnOffset - this.visualConfig.arcCircleLabelPlaceholderHeight/2;
        ar.circleHeight = this.visualConfig.arcCircleLabelPlaceholderHeight;
        ar.circleWidth = this.visualConfig.arcCircleLabelPlaceholderWidth;
      }
      else {
        ar.label.yArcLabel = ar.yArcOffset + 3;
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
      yHighlight: yHighlight,
      arcs: resArcs
    }

    return line;
  }

  private elaborateArcLabel(name: string) {
    let labelText = name.trim().substring(0, this.visualConfig.labelMaxLenght);
    let textWidth = this.getComputedTextLength(labelText, this.visualConfig.arcFont);
    let labelWidth = textWidth + this.visualConfig.labelPaddingXAxis * 2;

    return {
      labelText: labelText,
      textWidth: textWidth,
      labelWidth: labelWidth
    };
  }

  private elaborateEndedArc(r: any, lineTowers: Array<any>, sourceSpanLimit: number, targetSpanLimit: number, startIndex: number, lineArcs: Array<any>, isFromLeftToRight: boolean) {
    let arcType = "endedArc";

    // ComputeStartAndEndXPosition
    let xPositionRes = this.computeStartAndEndXPosition(sourceSpanLimit, targetSpanLimit, startIndex);
    let startArcX = xPositionRes.startArcX;
    let endArcX = xPositionRes.endArcX;

    // ElaborateArcLabel
    let arcLabelRes = this.elaborateArcLabel(r.relation.name)
    let labelText = arcLabelRes.labelText;
    let textWidth = arcLabelRes.textWidth;
    let labelWidth = arcLabelRes.labelWidth;

    let endSecondSegment = endArcX;

    if (isFromLeftToRight) {
      // startFirstSegment += this.visualConfig.arcAngleOffset;
      startArcX = this.visualConfig.stdTextOffsetX;
      endSecondSegment -= this.visualConfig.arcAngleOffset;
    }
    else {
      // startFirstSegment -= this.visualConfig.arcAngleOffset;
      startArcX = this.svg.nativeElement.clientWidth;
      endSecondSegment += this.visualConfig.arcAngleOffset;
    }

    let startFirstSegment = startArcX;

    let arcCenter = Math.abs(endSecondSegment - startFirstSegment)/2;

    let arcSize = Math.abs(endArcX - startArcX);
    let circleVisible = labelWidth >= arcSize || textWidth == 0;

    if (circleVisible) {
      labelWidth = this.visualConfig.arcCircleLabelPlaceholderWidth;
    }

    let signChange = isFromLeftToRight ? 1 : -1;
    let endFirstSegment = startFirstSegment + signChange * (arcCenter - labelWidth/2);
    let startSecondSegment = endFirstSegment + signChange * labelWidth;

    let labelStartX = Math.min(startSecondSegment, endFirstSegment);
    let labelEndX = Math.max(startSecondSegment, endFirstSegment);
    let startXText = startFirstSegment + signChange * arcCenter

    let yOffset = this.computeArcOffset(lineTowers, sourceSpanLimit, targetSpanLimit, lineArcs, startArcX, endArcX, arcType);

    // let sAnn = this.findAnnotationInTowers(r.sourceAnn.id, lineTowers);
    // let tAnn = this.findAnnotationInTowers(r.targetAnn.id, lineTowers);

    // let yAnnOffset = Math.max(sAnn.yOffset, tAnn.yOffset);
    // yOffset -= yAnnOffset;

    let yLabel = yOffset;

    let arc = {
      start: {
        x: startArcX,
        y: 0,
      },
      end: {
        x: endArcX,
        y: r.targetTower.yTowerOffset,
      },
      yArcOffset: yOffset,
      yAnnOffset: 0,
      firstSegment: {
        start: startFirstSegment,
        end: endFirstSegment
      },
      secondSegment: {
        start: startSecondSegment,
        end: endSecondSegment
      },
      label: {
        start: labelStartX,
        end: labelEndX,
        width: labelWidth,
        text: labelText,
        startXText: startXText,
        yArcLabel: yLabel
      },
      relation: r,
      relationId: r.relation.id,
      type: arcType,
      circleVisible: circleVisible
    }

    return arc;
  }

  private elaborateInLineArc(r: any, lineTowers: Array<any>, sourceSpanLimit: number, targetSpanLimit: number, startIndex: number, lineArcs: Array<any>, isFromLeftToRight: boolean) {
    let arcType = "includedArc";

    // ComputeStartAndEndXPosition
    let xPositionRes = this.computeStartAndEndXPosition(sourceSpanLimit, targetSpanLimit, startIndex);
    let startArcX = xPositionRes.startArcX;
    let endArcX = xPositionRes.endArcX;

    // ElaborateArcLabel
    let arcLabelRes = this.elaborateArcLabel(r.relation.name)
    let labelText = arcLabelRes.labelText;
    let textWidth = arcLabelRes.textWidth;
    let labelWidth = arcLabelRes.labelWidth;

    let startFirstSegment = startArcX;
    let endSecondSegment = endArcX;

    if (isFromLeftToRight) {
      startFirstSegment += this.visualConfig.arcAngleOffset;
      endSecondSegment -= this.visualConfig.arcAngleOffset;
    }
    else {
      startFirstSegment -= this.visualConfig.arcAngleOffset;
      endSecondSegment += this.visualConfig.arcAngleOffset;
    }

    let arcCenter = Math.abs(endSecondSegment - startFirstSegment)/2;

    let arcSize = Math.abs(endArcX - startArcX);
    let circleVisible = labelWidth >= arcSize || textWidth == 0;

    if (circleVisible) {
      labelWidth = this.visualConfig.arcCircleLabelPlaceholderWidth;
    }

    let signChange = isFromLeftToRight ? 1 : -1;
    let endFirstSegment = startFirstSegment + signChange * (arcCenter - labelWidth/2);
    let startSecondSegment = endFirstSegment + signChange * labelWidth;

    let labelStartX = Math.min(startSecondSegment, endFirstSegment);
    let labelEndX = Math.max(startSecondSegment, endFirstSegment);
    let startXText = startFirstSegment + signChange * arcCenter

    let yOffset = this.computeArcOffset(lineTowers, sourceSpanLimit, targetSpanLimit, lineArcs, startArcX, endArcX, arcType);

    // let sAnn = this.findAnnotationInTowers(r.sourceAnn.id, lineTowers);
    // let tAnn = this.findAnnotationInTowers(r.targetAnn.id, lineTowers);

    // let yAnnOffset = Math.max(sAnn.yOffset, tAnn.yOffset);
    // yOffset -= yAnnOffset;

    let yLabel = yOffset;

    let arc = {
      start: {
        x: startArcX,
        y: r.sourceTower.yTowerOffset,
      },
      end: {
        x: endArcX,
        y: r.targetTower.yTowerOffset,
      },
      yArcOffset: yOffset,
      yAnnOffset: 0,
      firstSegment: {
        start: startFirstSegment,
        end: endFirstSegment
      },
      secondSegment: {
        start: startSecondSegment,
        end: endSecondSegment
      },
      label: {
        start: labelStartX,
        end: labelEndX,
        width: labelWidth,
        text: labelText,
        startXText: startXText,
        yArcLabel: yLabel
      },
      relation: r,
      relationId: r.relation.id,
      type: arcType,
      circleVisible: circleVisible
    }

    return arc;
  }

  private elaboratePassingArc(r: any, lineTowers: Array<any>, sourceSpanLimit: number, targetSpanLimit: number, startIndex: number, lineArcs: Array<any>, isFromLeftToRight: boolean) {
    let arcType = "passingArc";

    // ComputeStartAndEndXPosition
    let xPositionRes = this.computeStartAndEndXPosition(sourceSpanLimit, targetSpanLimit, startIndex);
    let startArcX = xPositionRes.startArcX;
    let endArcX = xPositionRes.endArcX;

    // ElaborateArcLabel
    let arcLabelRes = this.elaborateArcLabel(r.relation.name)
    let labelText = arcLabelRes.labelText;
    let textWidth = arcLabelRes.textWidth;
    let labelWidth = arcLabelRes.labelWidth;

    if (isFromLeftToRight) {
      startArcX = this.visualConfig.stdTextOffsetX;
      endArcX = this.svg.nativeElement.clientWidth;
    }
    else {
      startArcX = this.svg.nativeElement.clientWidth;
      endArcX = this.visualConfig.stdTextOffsetX;
    }

    let startFirstSegment = startArcX;
    let endSecondSegment = endArcX;

    let arcCenter = Math.abs(endSecondSegment - startFirstSegment)/2;

    let arcSize = Math.abs(endArcX - startArcX);
    let circleVisible = labelWidth >= arcSize || textWidth == 0;

    if (circleVisible) {
      labelWidth = this.visualConfig.arcCircleLabelPlaceholderWidth;
    }

    let signChange = isFromLeftToRight ? 1 : -1;
    let endFirstSegment = startFirstSegment + signChange * (arcCenter - labelWidth/2);
    let startSecondSegment = endFirstSegment + signChange * labelWidth;

    let labelStartX = Math.min(startSecondSegment, endFirstSegment);
    let labelEndX = Math.max(startSecondSegment, endFirstSegment);
    let startXText = startFirstSegment + signChange * arcCenter
    startXText = startFirstSegment + signChange * arcCenter
    let yOffset = this.computeArcOffset(lineTowers, sourceSpanLimit, targetSpanLimit, lineArcs, startArcX, endArcX, arcType);

    // let sAnn = this.findAnnotationInTowers(r.sourceAnn.id, lineTowers);
    // let tAnn = this.findAnnotationInTowers(r.targetAnn.id, lineTowers);

    // let yAnnOffset = Math.max(sAnn.yOffset, tAnn.yOffset);
    // yOffset -= yAnnOffset;

    let yLabel = yOffset;

    let arc = {
      start: {
        x: startArcX,
        y: 0,
      },
      end: {
        x: endArcX,
        y: 0,
      },
      yArcOffset: yOffset,
      yAnnOffset: 0,
      firstSegment: {
        start: startFirstSegment,
        end: endFirstSegment
      },
      secondSegment: {
        start: startSecondSegment,
        end: endSecondSegment
      },
      label: {
        start: labelStartX,
        end: labelEndX,
        width: labelWidth,
        text: labelText,
        startXText: startXText,
        yArcLabel: yLabel
      },
      relation: r,
      relationId: r.relation.id,
      type: arcType,
      circleVisible: circleVisible
    }

    return arc;
  }

  private elaborateStartedArc(r: any, lineTowers: Array<any>, sourceSpanLimit: number, targetSpanLimit: number, startIndex: number, lineArcs: Array<any>, isFromLeftToRight: boolean) {
    let arcType = "startedArc";

    // ComputeStartAndEndXPosition
    let xPositionRes = this.computeStartAndEndXPosition(sourceSpanLimit, targetSpanLimit, startIndex);
    let startArcX = xPositionRes.startArcX;
    let endArcX = xPositionRes.endArcX;

    // ElaborateArcLabel
    let arcLabelRes = this.elaborateArcLabel(r.relation.name)
    let labelText = arcLabelRes.labelText;
    let textWidth = arcLabelRes.textWidth;
    let labelWidth = arcLabelRes.labelWidth;

    let startFirstSegment = startArcX;

    if (isFromLeftToRight) {
      startFirstSegment += this.visualConfig.arcAngleOffset;
      endArcX = this.svg.nativeElement.clientWidth;
      // endSecondSegment -= this.visualConfig.arcAngleOffset;
    }
    else {
      startFirstSegment -= this.visualConfig.arcAngleOffset;
      endArcX = this.visualConfig.stdTextOffsetX;
      // endSecondSegment += this.visualConfig.arcAngleOffset;
    }

    let endSecondSegment = endArcX;

    let arcCenter = Math.abs(endSecondSegment - startFirstSegment)/2;

    let arcSize = Math.abs(endArcX - startArcX);
    let circleVisible = labelWidth >= arcSize || textWidth == 0;

    if (circleVisible) {
      labelWidth = this.visualConfig.arcCircleLabelPlaceholderWidth;
    }

    let signChange = isFromLeftToRight ? 1 : -1;
    let endFirstSegment = startFirstSegment + signChange * (arcCenter - labelWidth/2);
    let startSecondSegment = endFirstSegment + signChange * labelWidth;

    if (startSecondSegment < this.visualConfig.stdTextOffsetX) {
      startSecondSegment = this.visualConfig.stdTextOffsetX;
      endSecondSegment = this.visualConfig.stdTextOffsetX - 1;
    }

    let labelStartX = Math.min(startSecondSegment, endFirstSegment);
    let labelEndX = Math.max(startSecondSegment, endFirstSegment);
    let startXText = startFirstSegment + signChange * arcCenter

    let yOffset = this.computeArcOffset(lineTowers, sourceSpanLimit, targetSpanLimit, lineArcs, startArcX, endArcX, arcType);

    // let sAnn = this.findAnnotationInTowers(r.sourceAnn.id, lineTowers);
    // let tAnn = this.findAnnotationInTowers(r.targetAnn.id, lineTowers);

    // let yAnnOffset = Math.max(sAnn.yOffset, tAnn.yOffset);
    // yOffset -= yAnnOffset;

    let yLabel = yOffset;

    let arc = {
      start: {
        x: startArcX,
        y: r.sourceTower.yTowerOffset,
      },
      end: {
        x: endArcX,
        y: 0,
      },
      yArcOffset: yOffset,
      yAnnOffset: 0,
      firstSegment: {
        start: startFirstSegment,
        end: endFirstSegment
      },
      secondSegment: {
        start: startSecondSegment,
        end: endSecondSegment
      },
      label: {
        start: labelStartX,
        end: labelEndX,
        width: labelWidth,
        text: labelText,
        startXText: startXText,
        yArcLabel: yLabel
      },
      relation: r,
      relationId: r.relation.id,
      type: arcType,
      circleVisible: circleVisible
    }

    return arc;
  }

  private elaborateTextLabel(layer: Layer | undefined, annotation: any) {
    return layer?.id as unknown as string || ""; //layer?.name || ""; // il testo dell'annotazione dovrebbe essere le sue features separate dal carattere '|' ?
  }

  private findAnnotationById(id: number) {
    return this.simplifiedAnns.find((an: any) => an.id == id);
  }

  private findAnnotationInTowers(id: number, lineTowers: Array<any>) {
    var t = lineTowers.find((t: any) => t.tower.some((ann: any) => ann.id == id));

    var ann = undefined;

    if (t && t.tower) {
      ann = t.tower.find((ann: any) => ann.id == id);
    }

    return ann;
  }

  private findTowerByAnnotationId(id: number, lineTowers: Array<any>) {
    var t = lineTowers.find((t: any) => t.tower.some((ann: any) => ann.id == id));
    return t;
  }

  private generateArcPath(ar: any): { firstSegmentPath: string; secondSegmentPath: string; } {
    let firstArcSegment = "";
    let secondArcSegment = "";

    switch (ar.type) {
      case "includedArc": {
        let moveToArcStart = "M " + ar.start.x + " " + ar.start.y;
        let moveToFirstStart = "L " + ar.firstSegment.start + " " + ar.yArcOffset;
        let lineFirstSegment = "L " + ar.firstSegment.end + " " + ar.yArcOffset;

        let moveToSecondStart = "M " + ar.secondSegment.start + " " + ar.yArcOffset;
        let lineSecondSegment = "L " + ar.secondSegment.end + " " + ar.yArcOffset;
        let moveToArcEnd = "L " + ar.end.x + " " + ar.end.y;

        firstArcSegment = moveToArcStart + " " + moveToFirstStart + " " + lineFirstSegment;
        secondArcSegment = moveToSecondStart + " " + lineSecondSegment + " " + moveToArcEnd;
        break;
      }

      case "startedArc": {
        let moveToArcStart = "M " + ar.start.x + " " + ar.start.y;
        let moveToFirstStart = "L " + ar.firstSegment.start + " " + ar.yArcOffset;
        let lineFirstSegment = "L " + ar.firstSegment.end + " " + ar.yArcOffset;

        let moveToSecondStart = "M " + ar.secondSegment.start + " " + ar.yArcOffset;
        let lineSecondSegment = "L " + ar.secondSegment.end + " " + ar.yArcOffset;

        firstArcSegment = moveToArcStart + " " + moveToFirstStart + " " + lineFirstSegment;
        secondArcSegment = moveToSecondStart + " " + lineSecondSegment;
        break;
      }

      case "endedArc": {
        let moveToFirstStart = "M " + ar.firstSegment.start + " " + ar.yArcOffset;
        let lineFirstSegment = "L " + ar.firstSegment.end + " " + ar.yArcOffset;

        let moveToSecondStart = "M " + ar.secondSegment.start + " " + ar.yArcOffset;
        let lineSecondSegment = "L " + ar.secondSegment.end + " " + ar.yArcOffset;
        let moveToArcEnd = "L " + ar.end.x + " " + ar.end.y;

        firstArcSegment = moveToFirstStart + " " + lineFirstSegment;
        secondArcSegment = moveToSecondStart + " " + lineSecondSegment + " " + moveToArcEnd;
        break;
      }

      case "passingArc": {
        let moveToFirstStart = "M " + ar.firstSegment.start + " " + ar.yArcOffset;
        let lineFirstSegment = "L " + ar.firstSegment.end + " " + ar.yArcOffset;

        let moveToSecondStart = "M " + ar.secondSegment.start + " " + ar.yArcOffset;
        let lineSecondSegment = "L " + ar.secondSegment.end + " " + ar.yArcOffset;

        firstArcSegment = moveToFirstStart + " " + lineFirstSegment;
        secondArcSegment = moveToSecondStart + " " + lineSecondSegment;
        break;
      }

      default: {
        break;
      }
    }

    return {
      firstSegmentPath: firstArcSegment,
      secondSegmentPath: secondArcSegment
    };
  }

  private generateCurlyPath(ann: any): string {
    let y = (ann.y + this.visualConfig.annotationHeight + 2)
    let move = "M " + ann.startX + " " + (y + this.visualConfig.curlyHeight) ;
    let x = ann.startX + (ann.endX - ann.startX)/2
    let curve1 = "C " + ann.startX + " " + y + ", " + x + " " + (y + this.visualConfig.curlyHeight) + ", " + x + " " + y
    let curve2 = "C " + x + " " + (y + this.visualConfig.curlyHeight) + ", " + ann.endX + " " + y + ", " + ann.endX + " " + (y + this.visualConfig.curlyHeight)

    return move + " " + curve1 + " " + curve2;
  }

  private generateHighlightId(id: number) {
    return "h-" + id;
  }

  private generateSentnumVerticalLine() {
    let x = this.visualConfig.stdSentnumOffsetX + this.visualConfig.spaceBeforeVerticalLine;
    return "M " + x + " 0 L " + x + " " + this.svgHeight;
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

  private getMaxArcOffset(array: Array<any>) {
    return Math.max(...array.map(o => (o.yArcOffset + o.yAnnOffset)));
  }

  private getMaxArcOffsetInRange(array: Array<any>, startX: number, endX: number) {
    let min = Math.min (startX, endX);
    let max = Math.max (startX, endX);

    let filteredArcs = array.filter((ar: any) => (ar.start.x >= min && ar.end.x <= max) ||
      (ar.start.x < min && ar.end.x >= min && ar.end.x <= max) ||
      (ar.start.x > max && ar.end.x >= min && ar.end.x <= max) ||
      (ar.start.x >= min && ar.start.x <= max && ar.end.x < min) ||
      (ar.start.x >= min && ar.start.x <= max && ar.end.x > max) ||
      (ar.start.x < min && ar.end.x > max));

    return this.getMaxArcOffset(filteredArcs);
  }

  private getMaxTowerPosition(array: any[]) {
    return Math.max(...array.map(o => (o.towerHeight + o.yTowerOffset)))
  }

  private getMaxTowerAroundAnns(lineTowers: Array<any>, start: number, end: number) {
    let filteredTowers = lineTowers.filter((t: any) => (t.spanCoordinates.start >= start && t.spanCoordinates.end <= end) || (t.spanCoordinates.start < start && t.spanCoordinates.end > start) || (t.spanCoordinates.start < end && t.spanCoordinates.end > end));

    return this.getMaxTowerPosition(filteredTowers);
  }

  private getStdLineHeight() {
    return this.visualConfig.spaceBeforeTextLine + this.visualConfig.spaceAfterTextLine + this.visualConfig.stdTextLineHeight;
  }

  private onlySpaces(str: string) {
    return str.trim().length === 0;
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
      let yAnnOffset = 0;

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
          borderColor: '#808080',
          text: layer?.id,
          textCoordinates: {
            x: Math.ceil(startX + w/2),
            y: 0
          },
          startX: startX,
          width: w,
          endX: endX,
          height: this.visualConfig.annotationHeight,
          yOffset: yAnnOffset,
          id: ann.id
        })

        yAnnOffset += this.visualConfig.annotationHeight

        lineHighlights.push({
          bgColor: layer?.color,
          coordinates: {
            x: startX - 1,
            y: 0
          },
          height: this.visualConfig.stdTextLineHeight - 2,
          width: w + 2,
          id: this.generateHighlightId(ann.id)
        })
      })

      let minorTowers = lineTowers.filter((lt) => (lt.spanCoordinates.start >= t.span.start && lt.spanCoordinates.end <= t.span.end) || (lt.spanCoordinates.start < t.span.start && lt.spanCoordinates.end > t.span.start) || (lt.spanCoordinates.start < t.span.end && lt.spanCoordinates.end > t.span.end));

      let yOffset = 0;

      yOffset = minorTowers.reduce((acc: any, o: any) => acc + o.towerHeight, 0);

      let minorTowersGroupedByYtowerOffset = minorTowers.reduce((a, { yTowerOffset,...rest }) => {
        const key = `${yTowerOffset}`;
        a[key] = a[key] || { yTowerOffset, towers: [] };
        a[key]["towers"].push(rest)
        return a;
      }, {});

      let towersGroups = [];
      towersGroups = Object.values(minorTowersGroupedByYtowerOffset);

      if (towersGroups.length > 0) {
        let maxGroup: any = towersGroups.reduce((max: any, tGroup: any) => max.yTowerOffset > tGroup.yTowerOffset ? max : tGroup);
        let higherTowersGroupHeight = Math.max(...maxGroup.towers.map((o: any) => (o.towerHeight)))

        yOffset = maxGroup.yTowerOffset + higherTowersGroupHeight;
        yOffset += (this.visualConfig.curlyHeight + 3);
      }

      lineTowers.push({
        spanCoordinates: t.span,
        tower: annTower,
        towerHeight: annTower.length * this.visualConfig.annotationHeight,
        yTowerOffset: yOffset
      })
    })

    return {
      lineTowers: lineTowers,
      lineHighLights: lineHighlights
    };
  }

  private renderArcsForLine(startIndex: number, endIndex: number, lineTowers: Array<any>) {
    let lineArcs = new Array();
    let relationsIncludedInLine = new Array();
    let relationsStartedInLine = new Array();
    let relationsEndedInLine = new Array();
    let relationsPassignThroughLine = new Array();

    for (let ar of this.simplifiedArcs) {
      if (!ar.srcAnnId || !ar.targetAnnId) {
        break;
      }

      let sourceAnn = this.findAnnotationById(ar.srcAnnId);
      let targetAnn = this.findAnnotationById(ar.targetAnnId);

      let sourceTower = this.findTowerByAnnotationId(ar.srcAnnId, lineTowers);
      let targetTower = this.findTowerByAnnotationId(ar.targetAnnId, lineTowers);

      if (!sourceAnn || !targetAnn) {
        break;
      }

      if (sourceAnn.span.start >= startIndex && sourceAnn.span.start <= endIndex &&
        targetAnn.span.end >= startIndex && targetAnn.span.end <= endIndex && sourceTower && targetTower) {
          relationsIncludedInLine.push({
            relation: ar,
            sourceAnn: sourceAnn,
            targetAnn: targetAnn,
            sourceTower: sourceTower,
            targetTower: targetTower,
            leftToRight: sourceAnn.span.start <= targetAnn.span.start
          });
      }

      if (sourceAnn.span.start >= startIndex && sourceAnn.span.start <= endIndex &&
        (targetAnn.span.end < startIndex || targetAnn.span.end > endIndex) && sourceTower) {
          relationsStartedInLine.push({
            relation: ar,
            sourceAnn: sourceAnn,
            targetAnn: targetAnn,
            sourceTower: sourceTower,
            targetTower: targetTower,
            leftToRight: sourceAnn.span.start <= targetAnn.span.start
          });
      }

      if (targetAnn.span.end >= startIndex && targetAnn.span.end <= endIndex &&
        (sourceAnn.span.start < startIndex || sourceAnn.span.start > endIndex) && targetTower) {
          relationsEndedInLine.push({
            relation: ar,
            sourceAnn: sourceAnn,
            targetAnn: targetAnn,
            sourceTower: sourceTower,
            targetTower: targetTower,
            leftToRight: sourceAnn.span.start <= targetAnn.span.start
          });
      }

      if (((sourceAnn.span.start < startIndex && sourceAnn.span.start < startIndex && targetAnn.span.start > endIndex && targetAnn.span.end > endIndex) ||
        (sourceAnn.span.start > endIndex && sourceAnn.span.start > endIndex && targetAnn.span.start < startIndex && targetAnn.span.end < startIndex))
          && !sourceTower && !targetTower) {
          relationsPassignThroughLine.push({
            relation: ar,
            sourceAnn: sourceAnn,
            targetAnn: targetAnn,
            sourceTower: sourceTower,
            targetTower: targetTower,
            leftToRight: sourceAnn.span.start <= targetAnn.span.start
          });
      }
    }

    relationsIncludedInLine.sort((a: any, b: any) =>
      (Math.abs(a.sourceAnn.span.start - a.targetAnn.span.start) - Math.abs(b.sourceAnn.span.start - b.targetAnn.span.start)) ||
      (Math.min(a.sourceAnn.span.start, a.targetAnn.span.start) - Math.min(b.sourceAnn.span.start, b.targetAnn.span.start))
    );

    relationsStartedInLine.sort((a: any, b: any) => a.leftToRight ?
      a.sourceAnn.span.end - b.sourceAnn.span.end :
      a.sourceAnn.span.start - b.sourceAnn.span.start
    );

    relationsEndedInLine.sort((a: any, b: any) => a.leftToRight ?
      a.targetAnn.span.start - b.targetAnn.span.start :
      a.targetAnn.span.end - b.targetAnn.span.end
    );

    relationsEndedInLine.reverse();

    relationsPassignThroughLine.sort((a: any, b: any) =>
      Math.min(Math.abs(a.sourceAnn.span.end - a.targetAnn.span.start), Math.abs(b.sourceAnn.span.end - b.targetAnn.span.start)) ||
      Math.min(Math.min(a.sourceAnn.span.start, a.targetAnn.span.start), Math.min(b.sourceAnn.span.start, b.targetAnn.span.start))
    );

    relationsIncludedInLine.forEach(r => {
      let arc: any;

      arc = this.elaborateInLineArc(
        r,
        lineTowers,
        r.leftToRight ? r.sourceAnn.span.end : r.sourceAnn.span.start,
        r.leftToRight ? r.targetAnn.span.start : r.targetAnn.span.end,
        startIndex,
        lineArcs,
        r.leftToRight
      );

      lineArcs.push(arc);
    })

    relationsStartedInLine.forEach(r => {
      let arc: any;

      arc = this.elaborateStartedArc(
        r,
        lineTowers,
        r.leftToRight ? r.sourceAnn.span.end : r.sourceAnn.span.start,
        r.leftToRight ? endIndex : startIndex,
        startIndex,
        lineArcs,
        r.leftToRight
      );

      lineArcs.push(arc);
    })

    relationsEndedInLine.forEach(r => {
      let arc: any;

      arc = this.elaborateEndedArc(
        r,
        lineTowers,
        r.leftToRight ? startIndex : endIndex,
        r.leftToRight ? r.targetAnn.span.start : r.targetAnn.span.end,
        startIndex,
        lineArcs,
        r.leftToRight
      );

      lineArcs.push(arc);
    })

    relationsPassignThroughLine.forEach(r => {
      let arc: any;

      arc = this.elaboratePassingArc(
        r,
        lineTowers,
        r.leftToRight ? startIndex : endIndex,
        r.leftToRight ? r.targetAnn.span.start : r.targetAnn.span.end,
        startIndex,
        lineArcs,
        r.leftToRight
      );

      lineArcs.push(arc);
    })

    return lineArcs;
  }

  private renderData() {
    this.rows = [];

    let rawText = JSON.parse(JSON.stringify(this.textRes.text));
    let rawAnns = JSON.parse(JSON.stringify(this.annotationsRes.annotations));
    let sentences = rawText.split(/(?<=[\.!\?])/g);
    let row_id = 0;
    let start = 0;
    let end = rawText.length;

    let width = this.svg.nativeElement.clientWidth - 20 - this.visualConfig.stdTextOffsetX;

    let textFont = getComputedStyle(document.documentElement).getPropertyValue('--text-font-size') + " " + getComputedStyle(document.documentElement).getPropertyValue('--text-font-family');
    this.visualConfig.textFont = textFont;

    let annFont = getComputedStyle(document.documentElement).getPropertyValue('--annotation-font-size') + " " + getComputedStyle(document.documentElement).getPropertyValue('--annotations-font-family')
    this.visualConfig.annotationFont = annFont;

    let arcFont = getComputedStyle(document.documentElement).getPropertyValue('--arc-font-size') + " " + getComputedStyle(document.documentElement).getPropertyValue('--arc-font-family')
    this.visualConfig.arcFont = arcFont;

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

    this.svgHeight = this.rows.reduce((acc, o) => acc + (o.height || 0), 0);

    this.sentnumVerticalLine = this.generateSentnumVerticalLine();
  }

  private showEditorAndHideOthers(name: EditorType) {
    switch (name) {
      case EditorType.Annotation: {
        this.showAnnotationEditor = true;
        this.showRelationEditor = false;
        break;
      }

      case EditorType.Relation: {
        this.showAnnotationEditor = false;
        this.showRelationEditor = true;
        break;
      }

      default: {
        this.showAnnotationEditor = true;
        this.showRelationEditor = false;
        return;
      }
    }
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
