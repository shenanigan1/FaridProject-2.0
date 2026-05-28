import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';

import { LoginPage } from './login.page';

import { AuthSessionService } from '@auth/services/auth-session.service';
import type { AllowedRole, LoginRequest, LoginResponse } from '@auth/models/auth.models';

describe('LoginPage', () => {
  let fixture: ComponentFixture<LoginPage>;
  let component: LoginPage;
  let router: Router;

  let sessionSpy: jasmine.SpyObj<AuthSessionService>;

  beforeEach(async () => {
    sessionSpy = jasmine.createSpyObj<AuthSessionService>('AuthSessionService', ['login']);

    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        provideRouter([]),
        { provide: AuthSessionService, useValue: sessionSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPage);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);

    spyOn(router, 'navigateByUrl').and.resolveTo(true);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('submit should mark form touched and do nothing if form invalid', () => {
    const markSpy = spyOn(component.form, 'markAllAsTouched');

    component.form.setValue({
      email: '',
      password: '',
      rememberMe: true,
    });

    component.submit();

    expect(markSpy).toHaveBeenCalled();
    expect(sessionSpy.login).not.toHaveBeenCalled();
  });

  it('shows required field errors with accessible descriptions', () => {
    component.form.setValue({
      email: '',
      password: '',
      rememberMe: true,
    });

    component.submit();
    fixture.detectChanges();

    const email = fixture.debugElement.query(By.css('#login-email')).nativeElement as HTMLInputElement;
    const password = fixture.debugElement.query(By.css('#login-password')).nativeElement as HTMLInputElement;

    expect(component.emailError()).toBe('Champ obligatoire');
    expect(component.passwordError()).toBe('Champ obligatoire');
    expect(email.getAttribute('aria-invalid')).toBe('true');
    expect(email.getAttribute('aria-describedby')).toBe('login-email-error');
    expect(password.getAttribute('aria-invalid')).toBe('true');
    expect(password.getAttribute('aria-describedby')).toBe('login-password-error');
  });

  it('submit should do nothing if already loading', () => {
    component.loading.set(true);

    component.form.setValue({
      email: 'a@b.com',
      password: 'secret',
      rememberMe: true,
    });

    component.submit();

    expect(sessionSpy.login).not.toHaveBeenCalled();
  });

  it('submit should call auth.login with credentials', () => {
    const mockRes: LoginResponse = { access: 'ACCESS_TOKEN', refresh: 'REFRESH_TOKEN', user: null };
    sessionSpy.login.and.returnValue(of(mockRes));

    component.form.setValue({
      email: 'manager@test.com',
      password: 'pwd',
      rememberMe: true,
    });

    component.submit();

    const expected: LoginRequest = {
      email: 'manager@test.com',
      password: 'pwd',
    };

    expect(sessionSpy.login).toHaveBeenCalledWith(expected, true);
  });

  it('on success: should login through the session and navigate HR users to /dashboard', () => {
    const mockRes: LoginResponse = {
      access: 'ACCESS_TOKEN',
      refresh: 'REFRESH_TOKEN',
      user: {
        id: 3,
        email: 'hr@test.com',
        first_name: 'Helene',
        last_name: 'RH',
        role: 'hr',
      },
    };
    sessionSpy.login.and.returnValue(of(mockRes));

    component.form.setValue({
      email: 'a@b.com',
      password: 'pwd',
      rememberMe: false,
    });

    component.submit();

    expect(sessionSpy.login).toHaveBeenCalledWith({ email: 'a@b.com', password: 'pwd' }, false);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/dashboard');
    expect(component.errorMessage()).toBeNull();
    expect(component.loading()).toBeFalse();
  });

  it('on success: should navigate managers to the manager portal', () => {
    const mockRes: LoginResponse = {
      access: 'ACCESS_TOKEN',
      refresh: 'REFRESH_TOKEN',
      user: {
        id: 7,
        email: 'manager@test.com',
        first_name: 'Marc',
        last_name: 'Martin',
        role: 'manager',
      },
    };
    sessionSpy.login.and.returnValue(of(mockRes));

    component.form.setValue({
      email: 'manager@test.com',
      password: 'pwd',
      rememberMe: false,
    });

    component.submit();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/manager');
  });

  it('on success: should navigate each role to its dedicated portal', () => {
    const cases: [AllowedRole, string][] = [
      ['admin', '/admin'],
      ['director', '/direction'],
      ['employee', '/employee'],
      ['driver', '/employee'],
      ['candidate', '/candidate-portal'],
    ];

    for (const [role, route] of cases) {
      (router.navigateByUrl as jasmine.Spy).calls.reset();
      sessionSpy.login.and.returnValue(of({
        access: 'ACCESS_TOKEN',
        refresh: 'REFRESH_TOKEN',
        user: {
          id: 11,
          email: `${role}@test.com`,
          first_name: 'Role',
          last_name: String(role),
          role,
        },
      }));

      component.form.setValue({
        email: `${role}@test.com`,
        password: 'pwd',
        rememberMe: true,
      });

      component.submit();

      expect(router.navigateByUrl).toHaveBeenCalledWith(route);
    }
  });

  it('on error: should show detail message if present and stop loading', () => {
    sessionSpy.login.and.returnValue(
      throwError(() => ({ error: { detail: 'Bad credentials' } })),
    );

    component.form.setValue({
      email: 'a@b.com',
      password: 'pwd',
      rememberMe: true,
    });

    component.submit();

    expect(component.errorMessage()).toBe('Bad credentials');
    expect(component.loading()).toBeFalse();
    expect(sessionSpy.login).toHaveBeenCalled();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('on error: should show non_field_errors[0] if detail missing', () => {
    sessionSpy.login.and.returnValue(
      throwError(() => ({ error: { non_field_errors: ['Nope'] } })),
    );

    component.form.setValue({
      email: 'a@b.com',
      password: 'pwd',
      rememberMe: true,
    });

    component.submit();

    expect(component.errorMessage()).toBe('Nope');
    expect(component.loading()).toBeFalse();
  });

  it('on error: should fallback to default message', () => {
    sessionSpy.login.and.returnValue(throwError(() => ({ error: {} })));

    component.form.setValue({
      email: 'a@b.com',
      password: 'pwd',
      rememberMe: true,
    });

    component.submit();

    expect(component.errorMessage()).toBe('Unable to log in. Please try again.');
    expect(component.loading()).toBeFalse();
  });


  it('renders the kinetic login alert when login error exists', () => {
    component.errorMessage.set('Invalid credentials.');

    fixture.detectChanges();

    const alert = fixture.debugElement.query(By.css('.ff-login-alert'));

    expect(alert).toBeTruthy();
  });

  it('renders forgot-password and request-access links to valid routes', () => {
    fixture.detectChanges();

    const forgot = fixture.debugElement.query(By.css('a[routerLink="/forgot-password"]'));
    const request = fixture.debugElement.query(By.css('a[routerLink="/request-access"]'));

    expect(forgot).toBeTruthy();
    expect(request).toBeTruthy();
  });

  it('shows a clear session-expired message from the login URL', async () => {
    const localSessionSpy = jasmine.createSpyObj<AuthSessionService>('AuthSessionService', ['login']);

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        provideRouter([{ path: 'login', component: LoginPage }]),
        { provide: AuthSessionService, useValue: localSessionSpy },
      ],
    }).compileComponents();

    const localRouter = TestBed.inject(Router);
    await localRouter.navigateByUrl('/login?session=expired');

    const localFixture = TestBed.createComponent(LoginPage);
    localFixture.detectChanges();

    expect(localFixture.componentInstance.errorMessage()).toBe(
      'Session expirée, reconnectez-vous.',
    );
  });
});
