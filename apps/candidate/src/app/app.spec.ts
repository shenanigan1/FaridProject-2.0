import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import {
  AuthService,
  AuthenticatedCandidate,
} from '@core/auth/services/auth.service';
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
      'saveAuthenticatedCandidate',
      'logout',
      'restoreSession',
    ]);

    authServiceSpy.isAuthenticated.and.returnValue(false);
    authServiceSpy.getAuthenticatedCandidate.and.returnValue(null);
    authServiceSpy.restoreSession.and.returnValue(of(null));

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
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

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Farid Candidate');
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
    expect(fixture.componentInstance.profileModalOpen).toBeFalse();
  });

  it('opens profile modal with prefilled values when user is authenticated', () => {
    authServiceSpy.isAuthenticated.and.returnValue(true);
    authServiceSpy.getAuthenticatedCandidate.and.returnValue(authenticatedCandidate);

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const profileButton = fixture.debugElement.query(
      By.css('[data-testid="profile-button"]'),
    ).nativeElement as HTMLButtonElement;

    profileButton.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.profileModalOpen).toBeTrue();
    expect(fixture.componentInstance.profileForm.getRawValue()).toEqual({
      firstName: 'Farid',
      lastName: 'Candidate',
      email: 'farid@example.com',
      phone: '+3311111111',
    });
  });

  it('saves profile changes for authenticated user', () => {
    authServiceSpy.getAuthenticatedCandidate.and.returnValue(authenticatedCandidate);

    const fixture = TestBed.createComponent(App);
    const component = fixture.componentInstance;
    component.profileModalOpen = true;

    component.profileForm.patchValue({
      firstName: 'Farid',
      lastName: 'Updated',
      email: 'updated@example.com',
      phone: '+3399999999',
    });

    component.onProfileSave();

    expect(authServiceSpy.saveAuthenticatedCandidate).toHaveBeenCalledWith({
      candidateId: 7,
      firstName: 'Farid',
      lastName: 'Updated',
      email: 'updated@example.com',
      phone: '+3399999999',
    });
    expect(component.profileModalOpen).toBeFalse();
  });

  it('logs out and closes profile modal', () => {
    const fixture = TestBed.createComponent(App);
    const component = fixture.componentInstance;
    component.profileModalOpen = true;

    component.onLogoutClicked();

    expect(authServiceSpy.logout).toHaveBeenCalledTimes(1);
    expect(component.profileModalOpen).toBeFalse();
  });
});
