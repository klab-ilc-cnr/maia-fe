// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.


/**Url to maia-be server */
const serverUrl = '';

/**Environment variables */
export const environment = {
  production: false,
  envName: 'local',
  maiaBeUrl: `${serverUrl}/api`,
  usersUrl: `${serverUrl}/api/users`,
  languagesUrl: `${serverUrl}/api/languages`,
  workspacesUrl: `${serverUrl}/api/workspaces`,
  layersUrl: `${serverUrl}/api/layers`,
  featureUrl: `${serverUrl}/api/features`,
  tagsetUrl: `${serverUrl}/api/tagsets`,
  annotationUrl: `${serverUrl}/api/annotations`,
  relationUrl: `${serverUrl}/api/relations`,
  maiaBeLexoUrl: `${serverUrl}/lexo`,
  maiaBeTextoUrl: `${serverUrl}/texto`,
  lexoPrefix: "ferrandi",
  lexoBaseIRI: "http://rut/somali/ferrandi#",
  applicationSubTitle: "NAME",
  demoHide: false,
};
