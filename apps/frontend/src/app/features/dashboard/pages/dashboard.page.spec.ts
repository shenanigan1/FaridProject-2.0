import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import { Router } from '@angular/router';
import { AuthSessionService } from '@auth/services/auth-session.service';
import { AllowedRole } from '@auth/models/auth.models';

import { DashboardPage } from './dashboard.page';

describe('DashboardPage', () => {
  const createComponent = (role: AllowedRole | null) => {
    const authMock = jasmine.createSpyObj<AuthSessionService>('AuthSessionService', [
      'loadMeOnce',
      'logout',
    ]);
    authMock.loadMeOnce.and.returnValue(
      of(
        role
          ? {
              id: 1,
              role,
              first_name: 'Admin',
              last_name: 'User',
              email: 'admin@fleetflow.com',
            }
          : null,
      ),
    );

    const routerMock = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);

    TestBed.configureTestingModule({
      imports: [DashboardPage],
      providers: [
        { provide: AuthSessionService, useValue: authMock },
        { provide: Router, useValue: routerMock },
      ],
    });

    const fixture = TestBed.createComponent(DashboardPage);
    fixture.detectChanges();
    return { fixture, routerMock };
  };

  it('renders recruitment dashboard metrics for admin role', () => {
    const { fixture } = createComponent('admin');
    const title = fixture.debugElement.query(By.css('h1'))?.nativeElement as HTMLElement;
    const counters = fixture.debugElement.queryAll(By.css('span'));
    const allText = counters.map((counter) =>
      (counter.nativeElement as HTMLElement).textContent?.trim(),
    );

    expect(title.textContent).toContain('TABLEAU DE BORD');
    expect(allText).toContain('428');
    expect(allText).toContain('24');
  });

  it('shows missing-info placeholders for non-recruitment roles', () => {
    const { fixture } = createComponent('candidate');
    const content = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(content).toContain('{total_candidates}');
    expect(content).toContain('{active_offers}');
  });

  it('navigates to tests when quick action is enabled', () => {
    const { fixture, routerMock } = createComponent('admin');
    const testsShortcut = fixture.debugElement.query(By.css('[data-testid="quick-tests"]'))
      ?.nativeElement as HTMLButtonElement;

    testsShortcut.click();

    expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/tests');
  });
});
