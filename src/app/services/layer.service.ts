import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { LayerWithFeatures } from '../model/layer-with-features';
import { Layer } from '../model/layer.model';

@Injectable({
  providedIn: 'root'
})
export class LayerService {

  private layerUrl: string;

  constructor(private http: HttpClient) {
    this.layerUrl = environment.layersUrl;
  }

  //LAYER

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

  // METODI MOCKATI

  public retrieveLayerById(layerId: number): Observable<LayerWithFeatures> {
    return this.http.get<any>(`assets/mock/layerWithFeatures${layerId}.json`);
  }

  // FINE METODI MOCKATI
}
