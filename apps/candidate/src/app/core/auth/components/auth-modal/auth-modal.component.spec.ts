import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { AuthService } from '@core/auth/services/auth.service';

import { AuthModalComponent } from './auth-modal.component';

describe('AuthModalComponent', () => {
  let fixture: ComponentFixture<AuthModalComponent>;
  let component: AuthModalComponent;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', [
      'signIn',
      'signUp',
    ]);

    authServiceSpy.signIn.and.returnValue(
      of({
        candidateId: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '',
      }),
    );
    authServiceSpy.signUp.and.returnValue(
      of({
        candidateId: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '',
      }),
    );

    await TestBed.configureTestingModule({
      imports: [AuthModalComponent],
      providers: [{ provide: AuthService, useValue: authServiceSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(AuthModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('signs in and emits authenticated on success', () => {
    spyOn(component.authenticated, 'emit');

    component.authForm.patchValue({
      email: 'john@example.com',
      password: 'Secret123',
    });

    component.onSubmit();

    expect(authServiceSpy.signIn).toHaveBeenCalled();
    expect(component.authenticated.emit).toHaveBeenCalledTimes(1);
    expect(component.errorMessage).toBeNull();
  });

  it('shows backend error when sign in fails', () => {
    authServiceSpy.signIn.and.returnValue(throwError(() => 'Invalid credentials.'));

    component.authForm.patchValue({
      email: 'john@example.com',
      password: 'Secret123',
    });

    component.onSubmit();

    expect(component.errorMessage).toBe('Invalid credentials.');
  });

  it('calls signUp in signup mode', () => {
    component.switchMode();
    component.authForm.patchValue({
      firstName: 'Jane',
      lastName: 'Smith',
      phone: '+33123456',
      email: 'jane@example.com',
      password: 'Secret123',
    });

    component.onSubmit();

    expect(authServiceSpy.signUp).toHaveBeenCalled();
  });
});
