import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Feature } from '../models/feature/feature';
import { LayerWithFeatures } from '../models/layer/layer-with-features';
import { Layer } from '../models/layer/layer.model';

@Injectable({
  providedIn: 'root'
})
export class LayerService {

  private layerUrl: string;
  private featureUrl: string;

  constructor(private http: HttpClient) {
    this.layerUrl = environment.layersUrl;
    this.featureUrl = environment.featureUrl;
  }

  public retrieveLayers(): Observable<Array<Layer>> {
    return this.http.get<Array<Layer>>(`${this.layerUrl}`);
  }

  public updateLayer(layer: Layer): Observable<Layer> {
    return this.http.put<Layer>(`${this.layerUrl}`, layer);
  }

  public deleteLayer(layerId: number | undefined): Observable<number> {
    return this.http.delete<number>(`${this.layerUrl}/${layerId}`);
  }

  public createLayer(layer: Layer): Observable<Layer> {
    return this.http.post<Layer>(`${this.layerUrl}`, layer);
  }

  //FEATURES

  public retrieveFeaturesByLayerId(layerId: number): Observable<Feature[]> {
    //return this.http.get<any>(`assets/mock/features/features${layerId}.json`);

    return this.http.get<Feature[]>(`${this.featureUrl}/${layerId}`);
  }

  public createFeature(item: any): Observable<Feature> {
    // return this.http.get<any>(`assets/mock/featuresCreate.json`);

    // QUI SARà UNA CHIAMATA POST
    return this.http.post<Feature>(`${this.featureUrl}`, item);
  }

  public updateFeature(item: any): Observable<Feature> {
    // return this.http.get<any>(`assets/mock/features.json`);

    // QUI SARà UNA CHIAMATA PUT
    return this.http.put<Feature>(`${this.featureUrl}`, item);
  }

  public canBeDeleted(layerId: number, featureId: number): Observable<boolean> {

    return this.http.get<boolean>(`${this.featureUrl}/canbedeleted/${layerId}/${featureId}`);
  }

  public deleteFeature(layerId: number, featureId: number): Observable<boolean> {
    return this.http.delete<boolean>(`${this.featureUrl}/${layerId}/${featureId}`);
  }
}
