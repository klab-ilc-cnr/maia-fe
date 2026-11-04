import { Component } from '@angular/core';
// Import nominato: il bundler include solo la proprieta' "version", non l'intero package.json
// (con require(), esbuild incorporava anche script e dipendenze).
import { version } from '../../../../../package.json';

/**Componente del footer */
@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent {
  APP_VERSION = version;
}
