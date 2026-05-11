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

  it('stores bearer tokens for the candidate session', () => {
    service.saveTokens('access', 'refresh');

    expect(service.getAccessToken()).toBe('access');
    expect(service.getRefreshToken()).toBe('refresh');
    expect(localStorage.getItem('access_token')).toBe('access');
    expect(localStorage.getItem('refresh_token')).toBe('refresh');
    expect(service.isAuthenticated()).toBeTrue();
  });

  it('clears stored tokens', () => {
    service.saveTokens('access', 'refresh');

    service.clear();

    expect(service.getAccessToken()).toBeNull();
    expect(service.getRefreshToken()).toBeNull();
    expect(service.isAuthenticated()).toBeFalse();
  });
});
