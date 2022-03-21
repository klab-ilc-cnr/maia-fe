// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

let clientid = "projectx-fe";
let secret = "your_app_secret";
let issuer = "http://localhost:8080/realms/princnr";
let allowedUrls = 'http://localhost:9000/projectx/api';

export const environment = {
  production: false,
  envName: 'local',
  keycloak: {
    issuer: issuer,
    redirectUri: window.location.origin + '/usersManagement/users',
    clientId: clientid,
    scope: 'openid profile email offline_access users',
    responseType: 'code',
    dummyClientSecret: secret,
    // logoutUrl: logoutUrl + clientid,
    skipIssuerCheck: true,
    // Remove the requirement of using Https to simplify the demo
    // THIS SHOULD NOT BE USED IN PRODUCTION
    // USE A CERTIFICATE FOR YOUR IDP
    // IN PRODUCTION
    requireHttps: false,
    // at_hash is not present in JWT token
    showDebugInformation: true,
    //   // at_hash is not present in JWT token
    disableAtHashCheck: true
  },
  allowedUrls: allowedUrls,
  usersUrl : allowedUrls+'/users'
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
