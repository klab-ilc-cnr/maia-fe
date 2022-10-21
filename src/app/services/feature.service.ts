import { CreateFeature } from './../models/feature/create-feature';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Feature } from '../models/feature/feature';

@Injectable({
  providedIn: 'root'
})
export class FeatureService {

  private featureUrl: string;

  constructor(private http: HttpClient) {
    this.featureUrl = environment.featureUrl;
  }

  public retrieveFeaturesByLayerId(layerId: number): Observable<Feature[]> {

    return this.http.get<Feature[]>(`${this.featureUrl}/${layerId}`);
  }

  public createFeature(item: any): Observable<any> {
    return this.http.post<any>(`${this.featureUrl}`, item);
  }

  public updateFeature(item: any): Observable<any> {
    return this.http.put<any>(`${this.featureUrl}`, item);
  }

  public deleteFeature(layerId: number, featureId: number): Observable<boolean> {
    return this.http.delete<boolean>(`${this.featureUrl}/${layerId}/${featureId}`);
  }

  public retrieveCanBeDeleted(layerId: number, featureId: number): Observable<boolean> {

    return this.http.get<boolean>(`${this.featureUrl}/canbedeleted/${layerId}/${featureId}`);
  }
}
