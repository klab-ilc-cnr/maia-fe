import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SystemService {
  private maiaURL = environment.maiaBeUrl;
  private textoURL = environment.maiaBeTextoUrl;
  private lexoURL = environment.maiaBeLexoUrl;

  constructor(
    private http: HttpClient,
  ) { }

  public retrieveLexoSystemInfo() {
    return this.http.get(`${this.lexoURL}/administration/systemInfo`);
  }

  public retrieveMaiaSystemEnvironment() {
    return this.http.get(`${this.maiaURL}/system/environment`);
  }

  public retrieveMaiaSystemInfo() {
    return this.http.get(`${this.maiaURL}/system/info`);
  }

  public retrieveTextoSystemEnvironment() {
    return this.http.get(`${this.textoURL}/system/environment`);
  }

  public retrieveTexoSystemInfo() {
    return this.http.get(`${this.textoURL}/system/info`);
  }

}
