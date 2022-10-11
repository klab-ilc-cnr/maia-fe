import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Feature } from '../models/feature/feature';
import { LayerWithFeatures } from '../models/layer/layer-with-features';

@Injectable({
  providedIn: 'root'
})
export class FeatureService {

  private featureUrl: string;

  constructor(private http: HttpClient) {
    this.featureUrl = environment.featureUrl;
  }

  // METODI MOCKATI
  public retrieveFeaturesByLayerId(layerId: number): Observable<Feature[]> {
    //return this.http.get<any>(`assets/mock/features/features${layerId}.json`);

    return this.http.get<Feature[]>(`${this.featureUrl}/${layerId}`);
  }
  // FINE METODI MOCKATI

  public createFeature(item: any): Observable<Feature> {
    return this.http.post<Feature>(`${this.featureUrl}`, item);
  }

  public updateFeature(item: any): Observable<Feature> {
    return this.http.put<Feature>(`${this.featureUrl}`, item);
  }

  public deleteFeature(layerId: number, featureId: number): Observable<void> {
    return this.http.delete<void>(`${this.featureUrl}/${layerId}/${featureId}`);
  }
}
