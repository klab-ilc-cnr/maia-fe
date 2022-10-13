import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
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


}
