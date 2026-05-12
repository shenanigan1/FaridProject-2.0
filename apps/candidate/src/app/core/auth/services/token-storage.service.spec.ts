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

  it('does not authenticate with an expired access token', () => {
    service.saveTokens(createJwtWithExpiration(Math.floor(Date.now() / 1000) - 60), 'refresh');

    expect(service.getAccessToken()).toBeNull();
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(service.getRefreshToken()).toBe('refresh');
    expect(service.isAuthenticated()).toBeFalse();
  });
});

function createJwtWithExpiration(expiration: number): string {
  const header = toBase64Url({ alg: 'HS256', typ: 'JWT' });
  const payload = toBase64Url({ exp: expiration });
  return `${header}.${payload}.signature`;
}

function toBase64Url(value: unknown): string {
  return btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}
