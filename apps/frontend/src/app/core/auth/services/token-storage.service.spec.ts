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

  it('keeps access token out of localStorage while preserving refresh for remembered sessions', () => {
    service.saveTokens('ACCESS', 'REFRESH', true);

    expect(service.getAccessToken()).toBe('ACCESS');
    expect(service.getRefreshToken()).toBe('REFRESH');
    expect(localStorage.getItem('auth_access')).toBeNull();
    expect(localStorage.getItem('auth_refresh')).toBe('REFRESH');
    expect(sessionStorage.getItem('auth_access')).toBe('ACCESS');
    expect(sessionStorage.getItem('auth_refresh')).toBeNull();
  });

  it('stores non-remembered sessions in sessionStorage only', () => {
    service.saveTokens('ACCESS', 'REFRESH', false);

    expect(service.getAccessToken()).toBe('ACCESS');
    expect(service.getRefreshToken()).toBe('REFRESH');
    expect(localStorage.getItem('auth_access')).toBeNull();
    expect(localStorage.getItem('auth_refresh')).toBeNull();
    expect(sessionStorage.getItem('auth_access')).toBe('ACCESS');
    expect(sessionStorage.getItem('auth_refresh')).toBe('REFRESH');
  });

  it('clears bearer tokens from both browser storages', () => {
    service.saveTokens('ACCESS', 'REFRESH', true);

    service.clear();

    expect(service.getAccessToken()).toBeNull();
    expect(service.getRefreshToken()).toBeNull();
    expect(localStorage.getItem('auth_access')).toBeNull();
    expect(localStorage.getItem('auth_refresh')).toBeNull();
  });
});
