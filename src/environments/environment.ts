// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.


const clientid = "projectx-fe";
// const appName = "/projectx-fe"
const appName = "/maia-fe"
// const issuer = "http://localhost:8080/realms/princnr";
// const allowedUrls = 'http://localhost:9000/projectx/api';
// const allowedUrls = 'https://klab.ilc.cnr.it/projectx/api'; //TODO sostituire con il backend xeel
const allowedUrls = 'https://146.48.93.234:9000/maia/api'; //TODO sostituire con il backend xeel

export const environment = {
  production: false,
  envName: 'local',
  allowedUrls: allowedUrls,
  usersUrl: allowedUrls + '/users',
  languagesUrl: allowedUrls + '/languages',
  workspacesUrl: allowedUrls + '/workspaces',
  layersUrl: allowedUrls + '/layers',
  featureUrl: allowedUrls + '/features',
  tagsetUrl: allowedUrls + '/tagsets',
  annotationUrl: allowedUrls + '/annotations',
  relationUrl: allowedUrls + '/relations',
  lexoUrl: allowedUrls + "/lexo/",
  textoUrl: allowedUrls,
  textoDebugUrl: "https://macalbanesi:9443",
  rutPrefix: "ferrandi",
  rutBaseIRI: "http://rut/somali/ferrandi#",
  applicationSubTitle: " - develop",
  demoHide: false,
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
