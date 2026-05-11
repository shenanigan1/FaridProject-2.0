import { TestBed } from '@angular/core/testing';

import { TokenStorageService } from './token-storage.service';

describe('TokenStorageService', () => {
  let service: TokenStorageService;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();

    TestBed.configureTestingModule({
      providers: [TokenStorageService],
    });

    service = TestBed.inject(TokenStorageService);
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('keeps access token in memory and never persists bearer tokens', () => {
    service.saveTokens('ACCESS', 'IGNORED_REFRESH', true);

    expect(service.getAccessToken()).toBe('ACCESS');
    expect(service.getRefreshToken()).toBeNull();
    expect(localStorage.getItem('auth_access')).toBeNull();
    expect(localStorage.getItem('auth_refresh')).toBeNull();
    expect(sessionStorage.getItem('auth_access')).toBeNull();
    expect(sessionStorage.getItem('auth_refresh')).toBeNull();
  });
});
