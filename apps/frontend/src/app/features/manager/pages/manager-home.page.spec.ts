import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { AuthSessionService } from '@auth/services/auth-session.service';
import { ManagerTestsService } from '../services/manager-tests.service';
import { ManagerHomePage } from './manager-home.page';

describe('ManagerHomePage', () => {
  let fixture: ComponentFixture<ManagerHomePage>;
  let component: ManagerHomePage;
  let authSpy: jasmine.SpyObj<AuthSessionService>;
  let testsSpy: jasmine.SpyObj<ManagerTestsService>;

  beforeEach(async () => {
    authSpy = jasmine.createSpyObj<AuthSessionService>('AuthSessionService', ['loadMeOnce']);
    testsSpy = jasmine.createSpyObj<ManagerTestsService>('ManagerTestsService', [
      'listAssignedTests',
    ]);

    authSpy.loadMeOnce.and.returnValue(
      of({
        id: 3,
        email: 'marc@example.com',
        first_name: 'Marc',
        last_name: 'Martin',
        role: 'manager',
      }),
    );
    testsSpy.listAssignedTests.and.returnValue(
      of([
        {
          id: 10,
          status: 'in_progress',
          candidateName: 'Jean Dupont',
          candidateEmail: 'jean@example.com',
          positionTitle: 'Conducteur',
          templateName: 'Conduite',
          createdAt: '2026-04-01T08:00:00Z',
          updatedAt: '2026-04-01T09:00:00Z',
          completedAt: null,
          validatedAt: null,
        },
        {
          id: 11,
          status: 'completed',
          candidateName: 'Marie Lefebvre',
          candidateEmail: 'marie@example.com',
          positionTitle: 'Porteur',
          templateName: 'Sécurité',
          createdAt: '2026-04-01T08:00:00Z',
          updatedAt: '2026-04-02T09:00:00Z',
          completedAt: '2026-04-02T09:00:00Z',
          validatedAt: null,
        },
      ]),
    );

    await TestBed.configureTestingModule({
      imports: [ManagerHomePage],
      providers: [
        provideRouter([]),
        { provide: AuthSessionService, useValue: authSpy },
        { provide: ManagerTestsService, useValue: testsSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ManagerHomePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads manager identity and separates pending/history tests', () => {
    expect(component.greetingName()).toBe('Marc');
    expect(component.pendingTests().length).toBe(1);
    expect(component.completedTests().length).toBe(1);
  });
});
