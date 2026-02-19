import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService } from '../../../core/auth/auth.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['login']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, LoginComponent],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should have a valid form when email and password are filled', () => {
    component.form.setValue({
      email: 'test@test.com',
      password: 'password123',
    });

    expect(component.form.valid).toBeTrue();
  });

  it('should show an error when form is invalid', () => {
    component.form.setValue({
      email: '',
      password: '',
    });

    component.submit();

    expect(component.error).toBe('Veuillez remplir un email valide et un mot de passe.');
    expect(authServiceSpy.login).not.toHaveBeenCalled();
  });

  it('should call AuthService.login() on submit', () => {
    authServiceSpy.login.and.returnValue(of({ access: 'a', refresh: 'b' }));

    component.form.setValue({
      email: 'test@test.com',
      password: 'password123',
    });

    component.submit();

    expect(authServiceSpy.login).toHaveBeenCalledWith('test@test.com', 'password123');
  });

  it('should redirect after successful login', () => {
    authServiceSpy.login.and.returnValue(of({ access: 'a', refresh: 'b' }));

    component.form.setValue({
      email: 'test@test.com',
      password: 'password123',
    });

    component.submit();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should show API error message when credentials are invalid', () => {
    authServiceSpy.login.and.returnValue(throwError(() => new Error('Unauthorized')));

    component.form.setValue({
      email: 'test@test.com',
      password: 'bad-password',
    });

    component.submit();

    expect(component.error).toBe('Identifiants incorrects.');
  });
});
