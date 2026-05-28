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



  it('shows required field errors in signup mode', () => {
    component.switchMode();

    component.authForm.patchValue({
      firstName: '',
      lastName: '',
      phone: '',
      email: 'invalid-email',
      password: '123',
    });

    component.onSubmit();

    expect(component.getFieldError('firstName')).toBe('Champ obligatoire');
    expect(component.getFieldError('email')).toBe('Please enter a valid email address.');
    expect(component.getFieldError('password')).toContain('Minimum 8 characters');
    expect(authServiceSpy.signUp).not.toHaveBeenCalled();
  });

  it('exposes the auth modal as an accessible dialog', () => {
    const dialog = (fixture.nativeElement as HTMLElement).querySelector('[role="dialog"]');

    expect(dialog).toBeTruthy();
    expect(dialog?.getAttribute('aria-modal')).toBe('true');
    expect(dialog?.getAttribute('aria-labelledby')).toBe('candidate-auth-title');
    expect(dialog?.getAttribute('tabindex')).toBe('-1');
    expect(document.activeElement).toBe(dialog);
  });

  it('closes the dialog when Escape is pressed', () => {
    spyOn(component.closed, 'emit');

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(component.closed.emit).toHaveBeenCalledTimes(1);
  });

  it('closes when the backdrop is clicked but keeps the dialog open when the panel is clicked', () => {
    spyOn(component.closed, 'emit');
    const host = fixture.nativeElement as HTMLElement;

    host.querySelector('[role="dialog"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(component.closed.emit).not.toHaveBeenCalled();

    host.querySelector('[data-testid="candidate-auth-backdrop"]')?.dispatchEvent(
      new MouseEvent('click', { bubbles: true }),
    );
    expect(component.closed.emit).toHaveBeenCalledTimes(1);
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
