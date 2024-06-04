import { Component } from '@angular/core';
declare const require: (path: string) => any;

/**Componente del footer */
@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent {
  APP_VERSION = require('../../../../../package.json').version;
}
