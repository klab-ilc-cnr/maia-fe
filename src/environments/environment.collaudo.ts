let clientid = "projectx-fe";
let appName = "/projectx-fe"
let issuer = "https://xeel.openskills.it/auth/realms/princnr";
let allowedUrls = 'https://xeel.openskills.it/projectx/api';

export const environment = {
  production: true,
  keycloak: {
    issuer: issuer,
    redirectUri: window.location.origin + appName,
    clientId: clientid,
    scope: 'openid profile email offline_access',
    responseType: 'code',
    // logoutUrl: logoutUrl + clientid,
    skipIssuerCheck: false,
    requireHttps: true,
    // at_hash is not present in JWT token
    showDebugInformation: true,
    //   // at_hash is not present in JWT token
    disableAtHashCheck: true
  },
  allowedUrls: allowedUrls,
  usersUrl : allowedUrls + '/users',
  languagesUrl : allowedUrls + '/languages',
  workspacesUrl: allowedUrls + '/workspaces',
  layersUrl: allowedUrls + '/layers',
  featureUrl: allowedUrls + '/features',
  tagsetUrl: allowedUrls + '/tagsets',
  annotationUrl: allowedUrls +'/annotations',
  relationUrl: allowedUrls +'/relations',
  lexoUrl : "/LexO-backend-beta/service/",
  cashUrl : "https://xeel.openskills.it/cash"
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
