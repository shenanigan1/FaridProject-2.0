import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { LoginPage } from './login.page';

import { AuthService } from '@auth/services/auth.service';
import { TokenStorageService } from '@auth/services/token-storage.service';
import type { LoginRequest, LoginResponse } from '@auth/models/auth.models';

describe('LoginPage', () => {
  let fixture: ComponentFixture<LoginPage>;
  let component: LoginPage;
  let router: Router;

  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let tokenStorageSpy: jasmine.SpyObj<TokenStorageService>;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', ['login']);
    tokenStorageSpy = jasmine.createSpyObj<TokenStorageService>('TokenStorageService', [
      'saveTokens',
    ]);

    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceSpy },
        { provide: TokenStorageService, useValue: tokenStorageSpy },
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
    expect(authServiceSpy.login).not.toHaveBeenCalled();
  });

  it('submit should do nothing if already loading', () => {
    component.loading.set(true);

    component.form.setValue({
      email: 'a@b.com',
      password: 'secret',
      rememberMe: true,
    });

    component.submit();

    expect(authServiceSpy.login).not.toHaveBeenCalled();
  });

  it('submit should call auth.login with credentials', () => {
    const mockRes: LoginResponse = { access: 'ACCESS_TOKEN', refresh: 'REFRESH_TOKEN' };
    authServiceSpy.login.and.returnValue(of(mockRes));

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

    expect(authServiceSpy.login).toHaveBeenCalledWith(expected);
  });

  it('on success: should save tokens and navigate to /dashboard', () => {
    const mockRes: LoginResponse = { access: 'ACCESS_TOKEN', refresh: 'REFRESH_TOKEN' };
    authServiceSpy.login.and.returnValue(of(mockRes));

    component.form.setValue({
      email: 'a@b.com',
      password: 'pwd',
      rememberMe: false,
    });

    component.submit();

    expect(tokenStorageSpy.saveTokens).toHaveBeenCalledWith('ACCESS_TOKEN', 'REFRESH_TOKEN', false);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/dashboard');
    expect(component.errorMessage()).toBeNull();
    expect(component.loading()).toBeFalse();
  });

  it('on error: should show detail message if present and stop loading', () => {
    authServiceSpy.login.and.returnValue(
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
    expect(tokenStorageSpy.saveTokens).not.toHaveBeenCalled();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('on error: should show non_field_errors[0] if detail missing', () => {
    authServiceSpy.login.and.returnValue(
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
    authServiceSpy.login.and.returnValue(throwError(() => ({ error: {} })));

    component.form.setValue({
      email: 'a@b.com',
      password: 'pwd',
      rememberMe: true,
    });

    component.submit();

    expect(component.errorMessage()).toBe('Invalid credentials.');
    expect(component.loading()).toBeFalse();
  });
});
