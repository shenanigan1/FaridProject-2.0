import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { App } from './app';
import { AuthSessionService } from './core/auth/services/auth-session.service';

@Component({ standalone: true, template: '' })
class EmptyRouteComponent {}

describe('App', () => {
  let authMock: jasmine.SpyObj<AuthSessionService>;

  beforeEach(async () => {
    authMock = jasmine.createSpyObj<AuthSessionService>('AuthSessionService', [
      'loadMeOnce',
      'logout',
    ]);
    authMock.loadMeOnce.and.returnValue(of(null));

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([{ path: 'login', component: EmptyRouteComponent }]),
        { provide: AuthSessionService, useValue: authMock },
      ],
    }).compileComponents();
  });

  it('creates the desktop application shell by default', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.debugElement.query(By.css('.ff-app-shell__topbar'))).toBeTruthy();
    expect(fixture.debugElement.query(By.css('.ff-app-shell__sidebar'))).toBeTruthy();
    expect(fixture.debugElement.query(By.css('.ff-app-shell__mobile-nav'))).toBeTruthy();
  });

  it('hides navigation chrome on the login route', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);

    await router.navigateByUrl('/login');
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('.ff-app-shell__topbar'))).toBeFalsy();
    expect(fixture.debugElement.query(By.css('.ff-app-shell__sidebar'))).toBeFalsy();
    expect(fixture.debugElement.query(By.css('.ff-app-shell__mobile-nav'))).toBeFalsy();
  });

  it('uses shared navigation for admin menus', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;

    app.me.set({ role: 'admin' });

    expect(app.menuItems().map((item) => item.route)).toEqual([
      '/dashboard',
      '/contact',
      '/tests',
      '/jobs',
    ]);
  });
});
