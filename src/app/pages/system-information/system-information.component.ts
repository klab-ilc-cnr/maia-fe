import { Component, OnInit } from '@angular/core';
import { take } from 'rxjs';
import { InfoType, SystemInformation } from 'src/app/models/system-information';
import { SystemStateService } from 'src/app/services/system-state.service';
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
      type: InfoType.FE,
    },
    <SystemInformation>{
      name: 'Angular',
      version: this.angularVersion.toString(),
      type: InfoType.FE
    }
  ];

  constructor(
    private systemState: SystemStateService,
  ) { }

  ngOnInit(): void {
    this.systemState.lexoSystemInfo$.pipe(take(1)).subscribe((resp: { [key: string]: any }) => {
      this.versionsList.push(<SystemInformation>{
        name: 'LexO',
        version: resp['lexOVersion'],
        type: InfoType.BE,
      });
    });
    this.systemState.maiaSystemInfo$.pipe(take(1)).subscribe((resp: { [key: string]: any }) => {
      this.versionsList.push(<SystemInformation>{
        name: resp['application.name'],
        version: resp['application.version'],
        type: InfoType.BE,
      });
    });
    this.systemState.textoSystemInfo$.pipe(take(1)).subscribe((resp: { [key: string]: any }) => {
      this.versionsList.push(<SystemInformation>{
        name: resp['application.name'],
        version: resp['application.version'],
        type: InfoType.BE,
      });
    });
  }
}
