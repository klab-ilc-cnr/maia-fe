import { Component, OnInit } from '@angular/core';
import { SystemInformation } from 'src/app/models/system-information';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-system-information',
  templateUrl: './system-information.component.html',
  styleUrls: ['./system-information.component.scss']
})
export class SystemInformationComponent implements OnInit {
  private interfaceVersion = environment.interfaceVersion;
  private angularVersion = environment.angularVersion;
  versionsList: SystemInformation[] = [
    <SystemInformation>{
      name: 'maia-fe',
      version: this.interfaceVersion.toString(),
      serverTime: '',
      javaVersion: ''
    },
    <SystemInformation>{
      name: 'Angular',
      version: this.angularVersion.toString(),
      serverTime: '',
      javaVersion: ''
    }
  ];

  constructor() { }

  ngOnInit(): void {
  }

}
