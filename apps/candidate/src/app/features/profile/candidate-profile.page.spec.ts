import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { AuthService } from '@core/auth/services/auth.service';
import { CandidateProfilePage } from './candidate-profile.page';

describe('CandidateProfilePage', () => {
  let fixture: ComponentFixture<CandidateProfilePage>;
  let component: CandidateProfilePage;
  let authSpy: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    authSpy = jasmine.createSpyObj<AuthService>('AuthService', [
      'getAuthenticatedCandidate',
      'updateProfile',
      'logout',
    ]);
    authSpy.getAuthenticatedCandidate.and.returnValue({
      candidateId: 7,
      firstName: 'Farid',
      lastName: 'Candidate',
      email: 'farid@example.com',
      phone: '+3311111111',
    });
    authSpy.updateProfile.and.returnValue(
      of({
        candidateId: 7,
        firstName: 'Farid',
        lastName: 'Updated',
        email: 'updated@example.com',
        phone: '+3399999999',
      }),
    );

    await TestBed.configureTestingModule({
      imports: [CandidateProfilePage],
      providers: [provideRouter([]), { provide: AuthService, useValue: authSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(CandidateProfilePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders a full candidate profile page with editable fields', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Profil candidat');
    expect(component.profileForm.getRawValue()).toEqual({
      firstName: 'Farid',
      lastName: 'Candidate',
      email: 'farid@example.com',
      phone: '+3311111111',
    });
  });

  it('saves profile changes through the candidate API', () => {
    component.profileForm.patchValue({
      firstName: 'Farid',
      lastName: 'Updated',
      email: 'updated@example.com',
      phone: '+3399999999',
    });

    component.saveProfile();

    expect(authSpy.updateProfile).toHaveBeenCalledWith({
      firstName: 'Farid',
      lastName: 'Updated',
      email: 'updated@example.com',
      phone: '+3399999999',
    });
    expect(component.pageMessage()).toBe('Profil mis a jour.');
  });
});
