import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { AuthSessionService } from '@auth/services/auth-session.service';
import { AuthService } from '@auth/services/auth.service';
import { ProfilePage } from './profile.page';

describe('ProfilePage', () => {
  let fixture: ComponentFixture<ProfilePage>;
  let component: ProfilePage;
  let sessionSpy: jasmine.SpyObj<AuthSessionService>;
  let authSpy: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    sessionSpy = jasmine.createSpyObj<AuthSessionService>('AuthSessionService', [
      'loadMeOnce',
      'setCurrentUser',
    ]);
    authSpy = jasmine.createSpyObj<AuthService>('AuthService', ['updateMe']);
    sessionSpy.loadMeOnce.and.returnValue(
      of({
        id: 3,
        email: 'admin@example.com',
        first_name: 'Ada',
        last_name: 'Admin',
        role: 'admin',
      }),
    );
    authSpy.updateMe.and.returnValue(
      of({
        id: 3,
        email: 'updated@example.com',
        first_name: 'Ada',
        last_name: 'Updated',
        role: 'admin',
      }),
    );

    await TestBed.configureTestingModule({
      imports: [ProfilePage],
      providers: [
        provideRouter([]),
        { provide: AuthSessionService, useValue: sessionSpy },
        { provide: AuthService, useValue: authSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfilePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders editable frontend profile fields', () => {
    expect(component.profileForm.getRawValue()).toEqual({
      first_name: 'Ada',
      last_name: 'Admin',
      email: 'admin@example.com',
    });
  });

  it('saves editable profile fields through auth API', () => {
    component.profileForm.patchValue({
      first_name: 'Ada',
      last_name: 'Updated',
      email: 'updated@example.com',
    });

    component.saveProfile();

    expect(authSpy.updateMe).toHaveBeenCalledWith({
      first_name: 'Ada',
      last_name: 'Updated',
      email: 'updated@example.com',
    });
    expect(component.error()).toBeNull();
  });
});
