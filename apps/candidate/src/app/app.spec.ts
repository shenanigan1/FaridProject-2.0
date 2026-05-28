import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router, provideRouter } from '@angular/router';

import {
  AuthService,
  AuthenticatedCandidate,
} from '@core/auth/services/auth.service';
import { SessionExpiredService } from '@core/auth/services/session-expired.service';
import { of } from 'rxjs';

import { App } from './app';

describe('App', () => {
  const authenticatedCandidate: AuthenticatedCandidate = {
    candidateId: 7,
    firstName: 'Farid',
    lastName: 'Candidate',
    email: 'farid@example.com',
    phone: '+3311111111',
  };

  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', [
      'isAuthenticated',
      'getAuthenticatedCandidate',
      'logout',
      'restoreSession',
      'hasStoredSession',
    ]);

    authServiceSpy.isAuthenticated.and.returnValue(false);
    authServiceSpy.hasStoredSession.and.returnValue(false);
    authServiceSpy.getAuthenticatedCandidate.and.returnValue(null);
    authServiceSpy.restoreSession.and.returnValue(of(null));

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: authServiceSpy,
        },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('renders the candidate top bar title', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.ff-candidate-shell')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.ff-candidate-topbar')).not.toBeNull();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('FleetFlow Candidate');
  });

  it('renders the candidate navigation entries', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.ff-candidate-nav')).not.toBeNull();
    const labels = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('[data-testid="candidate-nav-link"]'),
    ).map((node) => node.textContent?.trim());

    expect(labels).toEqual(['Offres', 'Candidatures', 'Tests', 'Profil']);
  });

  it('opens auth modal from profile button when user is logged out', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const profileButton = fixture.debugElement.query(
      By.css('[data-testid="profile-button"]'),
    ).nativeElement as HTMLButtonElement;

    profileButton.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.authModalOpen).toBeTrue();
  });

  it('navigates to candidate dashboard after authentication succeeds', () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl').and.resolveTo(true);

    fixture.componentInstance.onAuthSuccess();

    expect(fixture.componentInstance.authModalOpen).toBeFalse();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/dashboard');
  });

  it('opens auth modal when a stored session cannot be restored', () => {
    authServiceSpy.hasStoredSession.and.returnValue(true);
    authServiceSpy.restoreSession.and.returnValue(of(null));

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    expect(fixture.componentInstance.authModalOpen).toBeTrue();
  });

  it('navigates to the real profile page when user is authenticated', () => {
    authServiceSpy.isAuthenticated.and.returnValue(true);
    authServiceSpy.getAuthenticatedCandidate.and.returnValue(authenticatedCandidate);

    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl').and.resolveTo(true);
    fixture.detectChanges();

    const profileButton = fixture.debugElement.query(
      By.css('[data-testid="profile-button"]'),
    ).nativeElement as HTMLButtonElement;

    profileButton.click();
    fixture.detectChanges();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/profile');
  });

  it('logs out from the app shell action', () => {
    const fixture = TestBed.createComponent(App);
    const component = fixture.componentInstance;

    component.onLogoutClicked();

    expect(authServiceSpy.logout).toHaveBeenCalledTimes(1);
  });

  it('opens the login modal with a clear message when the session expires', () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    const sessionExpired = TestBed.inject(SessionExpiredService);
    spyOn(router, 'navigateByUrl').and.resolveTo(true);

    sessionExpired.notify('Session expirée, reconnectez-vous.');
    fixture.detectChanges();

    expect(fixture.componentInstance.authModalOpen).toBeTrue();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/jobs');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Session expirée, reconnectez-vous.',
    );
  });
});
