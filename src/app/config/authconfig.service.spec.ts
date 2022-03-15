import { AuthConfigService } from './authconfig.service';
import { OAuthEvent, OAuthSuccessEvent } from 'angular-oauth2-oidc';
import { Subject, of } from 'rxjs';

describe('AuthConfigService', () => {
  
  let service: AuthConfigService;
  
  const oauthServiceMock = jasmine.createSpyObj('oauthServiceMock', 
      ['loadDiscoveryDocumentAndLogin', 'setupAutomaticSilentRefresh', 'initImplicitFlow', 
      'configure', 'setStorage', 'tokenValidationHandler', 'getAccessToken', 'getIdToken']);
  const authConfigMock = jasmine.createSpyObj('authConfigMock', ['get']);

  beforeEach(() => {
    service = new AuthConfigService(oauthServiceMock, authConfigMock);

    oauthServiceMock.eventsSubject = new Subject<OAuthEvent>();
    oauthServiceMock.events = oauthServiceMock.eventsSubject.asObservable();
  });

  it('should be created', () => {
     expect(service).toBeTruthy();
  });


  it('should refresh token when user logged in', () => {
    
    oauthServiceMock.loadDiscoveryDocumentAndLogin.and.returnValue(new Promise((resolve) => resolve(true)));

    service.initAuth().then(() => {
      expect(oauthServiceMock.setupAutomaticSilentRefresh).not.toHaveBeenCalled();
    });

  });

  it('should initiate login flow when user not logged in', () => {
    
    oauthServiceMock.loadDiscoveryDocumentAndLogin.and.returnValue(new Promise((resolve) => resolve(false)));

    service.initAuth().catch(() => {
      expect(oauthServiceMock.initImplicitFlow).toHaveBeenCalled();
    });

  });

  it('should get access tokens after login flow', () => {
    
    const dummyAccessToken = 'dummy access token';
    const dummyIdToken = 'dummy id token';
    
    oauthServiceMock.loadDiscoveryDocumentAndLogin.and.returnValue(new Promise((resolve) => resolve(true)));
    oauthServiceMock.events = of(new OAuthSuccessEvent('token_received'));
    
    oauthServiceMock.getAccessToken.and.returnValue(dummyAccessToken);
    oauthServiceMock.getIdToken.and.returnValue(dummyIdToken);

    service.initAuth().then(() => {
      expect(oauthServiceMock.events).toBeDefined();
      oauthServiceMock.events.subscribe((e: OAuthEvent) => {
        expect(e.type).toBe('token_received');
      });
      expect(oauthServiceMock.getAccessToken).toHaveBeenCalled();
      expect(oauthServiceMock.getIdToken).toHaveBeenCalled();
      expect(service.decodedAccessToken).toBe(dummyAccessToken);
      expect(service.decodedIDToken).toBe(dummyIdToken);
    });

  });

});
