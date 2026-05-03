import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { AuthSessionService } from '@auth/services/auth-session.service';
import { AllowedRole } from '@auth/models/auth.models';
import { DashboardDataService, DashboardSnapshot } from '@features/dashboard/services/dashboard-data.service';

import { DashboardPage } from './dashboard.page';

describe('DashboardPage', () => {
  const snapshot: DashboardSnapshot = {
    positions: [
      {
        id: 1,
        company: 1,
        title: 'Driver',
        description: '',
        department: 'Ops',
        contract_type: 'Full-time',
        location: 'Paris',
        salary: null,
        is_active: true,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
    ],
    candidates: [
      {
        id: 4,
        user: {
          first_name: 'Nadia',
          last_name: 'Benali',
          email: 'nadia@example.com',
        },
        status: 'pending',
        flag: false,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
    ],
    applications: [
      {
        id: 9,
        candidate: 4,
        position: 1,
        status: 'applied',
        created_at: '2026-01-02T00:00:00Z',
        updated_at: '2026-01-02T00:00:00Z',
      },
    ],
    inProgressTests: [
      {
        evaluationId: 7,
        applicationId: 9,
        candidateId: 4,
        candidateName: 'Nadia Benali',
        candidateEmail: 'nadia@example.com',
        positionId: 1,
        positionTitle: 'Driver',
        templateName: 'Safety',
        updatedAt: '2026-01-03T00:00:00Z',
      },
    ],
  };

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
    const dashboardDataMock = jasmine.createSpyObj<DashboardDataService>('DashboardDataService', [
      'loadRecruitmentSnapshot',
    ]);
    dashboardDataMock.loadRecruitmentSnapshot.and.returnValue(of(snapshot));

    TestBed.configureTestingModule({
      imports: [DashboardPage],
      providers: [
        { provide: AuthSessionService, useValue: authMock },
        { provide: DashboardDataService, useValue: dashboardDataMock },
        { provide: Router, useValue: routerMock },
      ],
    });

    const fixture = TestBed.createComponent(DashboardPage);
    fixture.detectChanges();
    return { fixture, routerMock };
  };

  it('renders recruitment dashboard metrics for admin role', () => {
    const { fixture } = createComponent('admin');
    const content = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(content).toContain('SYSTEM_CORE');
    expect(content).toContain('1');
    expect(content).toContain('ACTIVE REQUISITIONS');
    expect(content).toContain('RECENT INFLOW');
    expect(content).toContain('Nadia Benali');
  });

  it('renders database-backed data for non-recruitment roles too', () => {
    const { fixture } = createComponent('candidate');
    const content = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(content).toContain('FLEET OPERATIONS');
    expect(content).toContain('Nadia Benali');
    expect(content).toContain('LIVE FEEDS');
  });

  it('navigates to jobs when the active requisitions KPI is clicked', () => {
    const { fixture, routerMock } = createComponent('admin');
    const activeRequisitions = fixture.debugElement.query(By.css('.ff-dashboard-kpi-card'))
      .nativeElement as HTMLButtonElement;

    activeRequisitions.click();

    expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/jobs');
  });
});
