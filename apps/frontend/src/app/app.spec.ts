import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router, provideRouter } from '@angular/router';

import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('renders top and bottom bars in fixed containers', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const topBarContainer = fixture.debugElement.query(By.css('div.fixed.inset-x-0.top-0'));
    const bottomBarContainer = fixture.debugElement.query(By.css('div.fixed.inset-x-0.bottom-0'));

    expect(topBarContainer).toBeTruthy();
    expect(bottomBarContainer).toBeTruthy();
  });

  it('hides top and bottom bars on /login route', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);

    await router.navigateByUrl('/login');
    fixture.detectChanges();

    const topBarContainer = fixture.debugElement.query(By.css('div.fixed.inset-x-0.top-0'));
    const bottomBarContainer = fixture.debugElement.query(By.css('div.fixed.inset-x-0.bottom-0'));

    expect(topBarContainer).toBeFalsy();
    expect(bottomBarContainer).toBeFalsy();
  });

  it('shows admin refactor menu items', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;

    app.me.set({ role: 'admin' });
    fixture.detectChanges();

    expect(app.menuItems()).toEqual([
      { label: 'Home', icon: 'home', route: '/dashboard' },
      { label: 'Contact', icon: 'users', route: '/contact' },
      { label: 'Jobs', icon: 'briefcase', route: '/jobs' },
      { label: 'Tests', icon: 'clipboard-check', route: '/tests' },
    ]);
  });
});
