const serverUrl = window.location.protocol + "//" + window.location.hostname + window.location.pathname.substring(0, window.location.pathname.lastIndexOf("/")) + '/maia';

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
  lexoPrefix: "lex",
  lexoBaseIRI: "http://lexica/mylexicon#",
  applicationSubTitle: " VocaBO",
  demoHide: true,
};