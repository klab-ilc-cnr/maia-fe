import { Component } from '@angular/core';
import { environment } from 'src/environments/environment';

/**Componente del footer */
@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent {
  currentVersion = environment.interfaceVersion;
}
