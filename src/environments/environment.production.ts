// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

import { LanguageService } from "src/app/services/language.service";

const clientid = "projectx-fe";
const appName = "/projectx-fe"
const issuer = "http://localhost:8080/realms/princnr"; //TODO sostituire con keycloak
const allowedUrls = 'http://localhost:9000/projectx/api'; //TODO sostituire con il backend xeel

export const environment = {
  production: true,
  keycloak: {
    issuer: issuer,
    redirectUri: window.location.origin + appName,
    clientId: clientid,
    scope: 'openid profile email offline_access',
    responseType: 'code',
    // logoutUrl: logoutUrl + clientid,
    skipIssuerCheck: true,
    // Remove the requirement of using Https to simplify the demo
    // THIS SHOULD NOT BE USED IN PRODUCTION
    // USE A CERTIFICATE FOR YOUR IDP
    // IN PRODUCTION
    requireHttps: false, //TODO verificare se passare a https per il deploy di prova
    // at_hash is not present in JWT token
    showDebugInformation: true,
    //   // at_hash is not present in JWT token
    disableAtHashCheck: true
  },
  allowedUrls: allowedUrls,
  usersUrl: allowedUrls + '/users',
  languagesUrl: allowedUrls + '/languages',
  workspacesUrl: allowedUrls + '/workspaces',
  layersUrl: allowedUrls + '/layers',
  featureUrl: allowedUrls + '/features',
  tagsetUrl: allowedUrls + '/tagsets',
  annotationUrl: allowedUrls + '/annotations',
  relationUrl: allowedUrls + '/relations',
  lexoUrl: "http://licodemo.ilc.cnr.it:8080/LexO-backend-maia/service/",
  cashUrl: "http://localhost:8085", //TODO sostituire con il deploy di cash (o altro backend del testo)
  rutPrefix: "ferrandi",
  rutBaseIRI: "http://rut/somali/ferrandi#"
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.